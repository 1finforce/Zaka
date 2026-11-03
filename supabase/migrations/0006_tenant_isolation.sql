-- Keep each organisation's data to itself now that there can be several.

-- 1. balances ran with the view owner's rights, which skips RLS: admins saw people from every org.
--    security_invoker makes it respect the profiles/expenses/topups policies of whoever queries it.
alter view balances set (security_invoker = true);

-- 2. mark_topped_up didn't check the person is in the admin's org.
create or replace function mark_topped_up(uid uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_spent numeric; v_allow numeric;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if not exists (select 1 from profiles where id = uid and org_id = current_org()) then raise exception 'not allowed'; end if;
  select spent, allowance into v_spent, v_allow from balances where user_id = uid;
  insert into topups (org_id, user_id, amount, allowance_at_time, topped_up_by)
  values (current_org(), uid, v_spent, v_allow, auth.uid());
end $$;

-- 3. admins could open receipts from any org; limit to receipts of people in their own org.
drop policy if exists receipts_read on storage.objects;
create policy receipts_read on storage.objects for select using (
  bucket_id = 'receipts' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (is_admin() and exists (select 1 from public.profiles p where p.id::text = (storage.foldername(name))[1] and p.org_id = current_org()))
  )
);
