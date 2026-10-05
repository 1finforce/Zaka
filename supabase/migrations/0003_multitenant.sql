-- who's allowed to become the first admin of a new org
create table pending_org_admins (
  email text primary key,
  org_id uuid not null references organisations(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);
alter table pending_org_admins enable row level security;  -- no policies = API can't touch it

-- trigger: attach to org from invite metadata, else from pending list, else refuse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_role user_role := 'employee'; v_name text; v_pending record;
begin
  v_org := (new.raw_user_meta_data->>'org_id')::uuid;
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));

  if v_org is null then
    select * into v_pending from pending_org_admins where lower(email) = lower(new.email);
    if v_pending.org_id is null then
      raise exception 'No organisation for %. Invite them from the app or register the org first.', new.email;
    end if;
    v_org := v_pending.org_id; v_role := 'org_admin'; v_name := coalesce(v_pending.full_name, v_name);
    delete from pending_org_admins where email = v_pending.email;
  end if;

  insert into profiles (id, org_id, email, full_name, role) values (new.id, v_org, new.email, v_name, v_role);
  return new;
end $$;

-- the function only the platform owner runs (SQL editor) to onboard a company
create or replace function create_organisation(p_name text, p_admin_email text, p_admin_name text default null, p_allowance numeric default 5000)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  insert into organisations (name, default_allowance) values (p_name, p_allowance) returning id into v_org;
  insert into pending_org_admins (email, org_id, full_name) values (lower(p_admin_email), v_org, p_admin_name);
  return v_org;
end $$;
revoke execute on function create_organisation from public, anon, authenticated;

grant select, delete on public.pending_org_admins to supabase_auth_admin;
