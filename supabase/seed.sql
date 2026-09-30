-- Optional: sample projects after your first sign-in (org exists by then)
insert into projects (org_id, name, code, colour, access) select id, 'Internal', 'INT', 'butter', 'all' from organisations limit 1;
insert into projects (org_id, name, code, colour, access) select id, 'Standard Bank migration', 'SB-MIG', 'peri', 'restricted' from organisations limit 1;
