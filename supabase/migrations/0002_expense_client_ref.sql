-- One id per "Log an expense" form load, so a double submit can only insert once.
alter table expenses add column if not exists client_ref uuid;
create unique index if not exists expenses_user_client_ref on expenses (user_id, client_ref);
