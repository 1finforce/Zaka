# Zaka — expense allowances

Internal app: projects, employee expense logging with receipts, monthly allowance top-ups.
Stack matches 1FinForce: Next.js 15 App Router, TypeScript, Tailwind, Supabase (Frankfurt), Vercel.

## Setup
1. Create a Supabase project (eu-central-1 / Frankfurt). Copy URL + anon key + service role key into `.env.local`.
2. Run the files in `supabase/migrations/` in order in the SQL editor (or `supabase db push`).
3. In Supabase Auth, enable Email + magic links; set Site URL to your app URL and add `/auth/callback` to redirect URLs.
4. `npm i && npm run dev`.
5. Onboard a company: in the SQL editor run `select create_organisation('Company', 'admin@company.com', 'Name');`, then invite that email from Supabase → Authentication → Users. When they accept, they join that organisation as its org admin. Everyone after that is invited from the People screen. Sign-ins from emails that were neither invited nor registered this way are refused.

## Roles
- `org_admin` — everything, plus invite/deactivate people, change roles and allowances.
- `admin` — projects, project access, monthly top-up, CSV import/export, all stats.
- `employee` — own balance, log expenses against permitted projects, own history.

## Balance model
Each person has an allowance (default R5 000, per-person override). Balance = allowance − expenses logged since their last recorded top-up.
On the top-up screen an admin sees "spent since last top-up" per person and marks it paid; that inserts a `topups` row and the balance resets to the allowance. Nothing resets on its own.

## Deploy
Push to GitHub, import into Vercel, set the four env vars. No cron needed.
