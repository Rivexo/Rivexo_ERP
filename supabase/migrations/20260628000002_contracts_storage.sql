-- Contratos en PDF: bucket de Storage + extension de can_access_entity para entity_type='deal'.

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy contracts_select on storage.objects
  for select to authenticated
  using (bucket_id = 'contracts' and (is_admin() or current_user_role() in ('sales', 'finance')));

create policy contracts_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contracts' and (is_admin() or current_user_role() in ('sales', 'finance')));

create policy contracts_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'contracts' and (is_admin() or current_user_role() = 'sales'));

-- files/comments/links sobre deals: misma regla que deals_select (admin/ventas/finanzas).
create or replace function can_access_entity(p_entity_type text, p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_entity_type
    when 'project' then (
      is_admin() or current_user_role() = 'finance'
      or (current_user_role() = 'project_manager' and is_project_team_member(p_entity_id))
      or exists (select 1 from tasks t where t.project_id = p_entity_id and t.assignee_id = auth.uid())
    )
    when 'task' then (
      is_admin() or current_user_role() = 'finance'
      or exists (
        select 1 from tasks t
        where t.id = p_entity_id
          and (
            (current_user_role() = 'project_manager' and is_project_team_member(t.project_id))
            or t.assignee_id = auth.uid()
          )
      )
    )
    when 'deal' then (
      is_admin() or current_user_role() in ('sales', 'finance')
    )
    else is_admin()
  end;
$$;
