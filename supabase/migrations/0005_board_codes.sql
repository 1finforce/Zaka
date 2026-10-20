-- TV pairing: an org admin makes a one-time 6-digit code, the TV types it in at /board
alter table organisations add column board_code text, add column board_code_expires timestamptz;
create unique index organisations_board_code on organisations (board_code) where board_code is not null;

-- failed/total pairing attempts per IP, for rate limiting; service role only
create table board_code_attempts (ip text not null, at timestamptz not null default now());
create index on board_code_attempts (ip, at);
alter table board_code_attempts enable row level security;  -- no policies = API can't touch it
