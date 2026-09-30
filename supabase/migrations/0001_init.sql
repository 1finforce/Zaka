-- Zaka schema. Single org per deployment, but org table kept so it can grow.
create extension if not exists "pgcrypto";

create type user_role as enum ('org_admin','admin','employee');
create type project_access as enum ('all','restricted');
create type project_status as enum ('active','archived');

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_allowance numeric(12,2) not null default 5000,
  currency text not null default 'ZAR',
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organisations(id),
  email text not null,
  full_name text,
  role user_role not null default 'employee',
  allowance_override numeric(12,2),
  active boolean not null default true,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  name text not null,
  code text not null,
  colour text not null default 'peri',
  access project_access not null default 'all',
  status project_status not null default 'active',
  created_at timestamptz default now(),
  unique (org_id, code)
);

create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  user_id uuid not null references profiles(id),
  project_id uuid not null references projects(id),
  spent_on date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Other',
  note text,
  receipt_path text,
  created_at timestamptz default now()
);
create index on expenses (user_id, created_at);
create index on expenses (project_id, spent_on);

create table topups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  user_id uuid not null references profiles(id),
  amount numeric(12,2) not null,          -- what was paid out (= spent since previous top-up)
  allowance_at_time numeric(12,2) not null,
  topped_up_by uuid references profiles(id),
  topped_up_at timestamptz not null default now()
);
create index on topups (user_id, topped_up_at desc);

-- ---------- helpers ----------
create or replace function current_role() returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;
create or replace function current_org() returns uuid language sql stable security definer as $$
  select org_id from profiles where id = auth.uid()
$$;
create or replace function is_admin() returns boolean language sql stable as $$
  select current_role() in ('org_admin','admin')
$$;

-- allowance for a user
create or replace function user_allowance(uid uuid) returns numeric language sql stable as $$
  select coalesce(p.allowance_override, o.default_allowance)
  from profiles p join organisations o on o.id = p.org_id where p.id = uid
$$;

-- last top-up timestamp (or account creation)
create or replace function period_start(uid uuid) returns timestamptz language sql stable as $$
  select coalesce((select max(topped_up_at) from topups where user_id = uid),
                  (select created_at from profiles where id = uid))
$$;

-- one row per active person: allowance, spent since last top-up, remaining
create or replace view balances as
select p.id as user_id, p.org_id, p.email, p.full_name, p.role, p.active,
       user_allowance(p.id) as allowance,
       period_start(p.id) as period_start,
       coalesce((select sum(amount) from expenses e where e.user_id = p.id and e.created_at > period_start(p.id)),0) as spent,
       user_allowance(p.id) - coalesce((select sum(amount) from expenses e where e.user_id = p.id and e.created_at > period_start(p.id)),0) as remaining,
       (select count(*) from expenses e where e.user_id = p.id and e.created_at > period_start(p.id) and e.receipt_path is null) as missing_receipts
from profiles p;

-- can this user log against this project?
create or replace function can_log(pid uuid) returns boolean language sql stable as $$
  select exists (
    select 1 from projects pr where pr.id = pid and pr.status = 'active' and pr.org_id = current_org()
      and (pr.access = 'all' or exists (select 1 from project_members m where m.project_id = pid and m.user_id = auth.uid()))
  )
$$;

-- mark a person as topped up (admin only). Amount = spent since last top-up.
create or replace function mark_topped_up(uid uuid) returns void language plpgsql security definer as $$
declare v_spent numeric; v_allow numeric;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  select spent, allowance into v_spent, v_allow from balances where user_id = uid;
  insert into topups (org_id, user_id, amount, allowance_at_time, topped_up_by)
  values (current_org(), uid, v_spent, v_allow, auth.uid());
end $$;

-- auto-create profile on signup, attach to the single org
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
declare v_org uuid;
begin
  select id into v_org from organisations limit 1;
  if v_org is null then
    insert into organisations (name) values ('My company') returning id into v_org;
  end if;
  insert into profiles (id, org_id, email, full_name)
  values (new.id, v_org, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------- RLS ----------
alter table organisations enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table expenses enable row level security;
alter table topups enable row level security;

create policy org_read on organisations for select using (id = current_org());
create policy org_update on organisations for update using (id = current_org() and current_role() = 'org_admin');

create policy profiles_read on profiles for select using (org_id = current_org());
create policy profiles_self on profiles for update using (id = auth.uid()) with check (role = (select role from profiles where id = auth.uid()));
create policy profiles_orgadmin on profiles for update using (org_id = current_org() and current_role() = 'org_admin');

create policy projects_read on projects for select using (org_id = current_org());
create policy projects_write on projects for all using (org_id = current_org() and is_admin()) with check (org_id = current_org());

create policy members_read on project_members for select using (exists (select 1 from projects p where p.id = project_id and p.org_id = current_org()));
create policy members_write on project_members for all using (is_admin());

create policy expenses_read on expenses for select using (org_id = current_org() and (user_id = auth.uid() or is_admin()));
create policy expenses_insert on expenses for insert with check (user_id = auth.uid() and org_id = current_org() and can_log(project_id));
create policy expenses_update on expenses for update using (org_id = current_org() and (user_id = auth.uid() or is_admin()));
create policy expenses_delete on expenses for delete using (org_id = current_org() and (user_id = auth.uid() or is_admin()));

create policy topups_read on topups for select using (org_id = current_org() and (user_id = auth.uid() or is_admin()));

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('receipts','receipts', false) on conflict do nothing;
create policy receipts_own_write on storage.objects for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy receipts_read on storage.objects for select using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));
