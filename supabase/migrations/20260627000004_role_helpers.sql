-- Returns the role of the currently authenticated user.
-- security definer + fixed search_path: avoids RLS recursion on profiles and search_path hijacking.
create function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function is_admin()
returns boolean
language sql
stable
as $$
  select current_user_role() in ('founder', 'partner');
$$;

revoke all on function current_user_role() from public;
revoke all on function is_admin() from public;
grant execute on function current_user_role() to authenticated;
grant execute on function is_admin() to authenticated;

-- Avoids recursion: a user can always read their own row regardless of is_admin().
create policy profiles_select on profiles
  for select to authenticated
  using (id = auth.uid() or is_admin());

create policy profiles_update on profiles
  for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

create policy profiles_insert_admin on profiles
  for insert to authenticated
  with check (is_admin());

-- Only founder/partner can change someone's role; everyone else's update attempt on role is rejected.
create function prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role and not is_admin() then
    raise exception 'Only founder/partner can change roles';
  end if;
  return new;
end;
$$;

create trigger guard_role_change before update on profiles
  for each row execute function prevent_role_self_escalation();
