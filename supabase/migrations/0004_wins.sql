create table wins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  from_user uuid not null references profiles(id),
  to_user uuid not null references profiles(id),
  tag text not null check (tag in ('Extra mile','Helped a teammate','Client win','Good idea','Just because')),
  message text not null check (char_length(message) <= 200),
  hidden boolean not null default false,
  created_at timestamptz default now()
);
create index on wins (org_id, created_at desc);
alter table wins enable row level security;
create policy wins_read on wins for select using (org_id = current_org() and (not hidden or is_admin()));
create policy wins_insert on wins for insert with check (org_id = current_org() and from_user = auth.uid() and to_user <> auth.uid());
create policy wins_hide on wins for update using (org_id = current_org() and is_admin());
-- gen_random_uuid() is core Postgres, so this default works under any search_path
-- (gen_random_bytes lives in the extensions schema and fails inside create_organisation, which sets search_path = public)
alter table organisations add column board_token text not null default replace(gen_random_uuid()::text, '-', '');
-- board page reads via service role, filtered by board_token; no anon policy needed.
