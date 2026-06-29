-- Fase 2: Project Management (IDEAS, tasks, Gantt/Calendario, SWOT, riesgos, decisiones).
-- Orden: 1) enums, 2) todas las tablas (sin RLS), 3) funciones helper, 4) RLS de todas
-- las tablas, 5) función de conversión. Evita referencias hacia adelante entre policies
-- y tablas que todavía no existen (lección de la migración de Fase 1).

create type project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type task_status as enum ('todo', 'in_progress', 'in_review', 'done', 'blocked');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type swot_type as enum ('strength', 'weakness', 'opportunity', 'threat');
create type risk_level as enum ('low', 'medium', 'high');
create type risk_status as enum ('open', 'mitigated', 'closed');
create type decision_impact as enum ('low', 'medium', 'high');

-- ---------------------------------------------------------------------------
-- 1) Tablas
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references deals(id),
  account_id uuid not null references accounts(id),
  business_line_id uuid references business_lines(id),
  name text not null,
  project_manager_id uuid references profiles(id),
  start_date date,
  due_date date,
  status project_status not null default 'planning',
  progress_pct numeric(5, 2) not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index projects_account_idx on projects (account_id);
create index projects_pm_idx on projects (project_manager_id);
create index projects_not_deleted_idx on projects (id) where deleted_at is null;

create trigger set_updated_at before update on projects
  for each row execute function set_updated_at();

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id),
  role_in_project text,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_members_project_idx on project_members (project_id);
create index project_members_user_idx on project_members (user_id);

-- Isolated from `projects` for the same column-security reason as deal_financials.
create table project_financials (
  project_id uuid primary key references projects(id) on delete cascade,
  budget_sold numeric(14, 2) not null default 0,
  direct_cost numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on project_financials
  for each row execute function set_updated_at();

create table ideas_phases (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  order_index int not null
);

insert into ideas_phases (code, name, order_index) values
  ('I', 'Investigación', 1),
  ('D', 'Diseño', 2),
  ('E', 'Ejecución', 3),
  ('A', 'Adopción', 4),
  ('S', 'Soporte', 5);

create table project_ideas_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  phase_id uuid not null references ideas_phases(id),
  objectives text,
  status task_status not null default 'todo',
  owner_id uuid references profiles(id),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, phase_id)
);

create index project_ideas_phases_project_idx on project_ideas_phases (project_id);

create trigger set_updated_at before update on project_ideas_phases
  for each row execute function set_updated_at();

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  ideas_phase_instance_id uuid references project_ideas_phases(id),
  parent_task_id uuid references tasks(id),
  title text not null,
  description text,
  assignee_id uuid references profiles(id),
  priority task_priority not null default 'medium',
  status task_status not null default 'todo',
  estimated_hours numeric(7, 2),
  actual_hours numeric(7, 2),
  start_date date,
  due_date date,
  position int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index tasks_project_idx on tasks (project_id);
create index tasks_assignee_idx on tasks (assignee_id);
create index tasks_parent_idx on tasks (parent_task_id);
create index tasks_not_deleted_idx on tasks (id) where deleted_at is null;

create trigger set_updated_at before update on tasks
  for each row execute function set_updated_at();

create table task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  type text not null default 'blocks',
  created_at timestamptz not null default now(),
  check (task_id <> depends_on_task_id)
);

create index task_dependencies_task_idx on task_dependencies (task_id);

create table project_swot (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type swot_type not null,
  description text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index project_swot_project_idx on project_swot (project_id);

create table project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  description text not null,
  impact risk_level not null default 'medium',
  probability risk_level not null default 'medium',
  mitigation text,
  owner_id uuid references profiles(id),
  status risk_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_risks_project_idx on project_risks (project_id);

create trigger set_updated_at before update on project_risks
  for each row execute function set_updated_at();

create table project_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  decided_by uuid references profiles(id),
  decided_at date not null default current_date,
  impact decision_impact not null default 'medium',
  created_at timestamptz not null default now()
);

create index project_decisions_project_idx on project_decisions (project_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  author_id uuid references profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_entity_idx on comments (entity_type, entity_id);

create trigger set_updated_at before update on comments
  for each row execute function set_updated_at();

create table links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  url text not null,
  label text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index links_entity_idx on links (entity_type, entity_id);

-- Sin uso todavía (subida real se hace en Fase 2B); RLS análoga a links.
create table files (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index files_entity_idx on files (entity_type, entity_id);

-- Insert-only audit trail, escrito explícitamente desde la capa de servicios (sin triggers mágicos).
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references profiles(id),
  diff jsonb,
  description text not null,
  created_at timestamptz not null default now()
);

create index activity_log_entity_idx on activity_log (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2) Funciones helper (ya existen todas las tablas que referencian)
-- ---------------------------------------------------------------------------
create function is_project_team_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from projects where id = p_project_id and project_manager_id = auth.uid()
  ) or exists (
    select 1 from project_members where project_id = p_project_id and user_id = auth.uid()
  );
$$;

revoke all on function is_project_team_member(uuid) from public;
grant execute on function is_project_team_member(uuid) to authenticated;

-- Dispatches to the access rule of the owning table so comments/links/activity_log
-- never need their own bespoke security model per entity type.
create function can_access_entity(p_entity_type text, p_entity_id uuid)
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
    else is_admin()
  end;
$$;

revoke all on function can_access_entity(text, uuid) from public;
grant execute on function can_access_entity(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table projects enable row level security;

create policy projects_select on projects
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(id))
    or exists (select 1 from tasks t where t.project_id = projects.id and t.assignee_id = auth.uid())
  );

-- Solo admin crea proyectos (vía convert_deal_to_project); PM solo actualiza los suyos.
create policy projects_insert on projects
  for insert to authenticated
  with check (is_admin());

create policy projects_update on projects
  for update to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(id)));

alter table project_members enable row level security;

create policy project_members_select on project_members
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance' or is_project_team_member(project_id));

create policy project_members_write on project_members
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table project_financials enable row level security;

create policy project_financials_select on project_financials
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
  );

create policy project_financials_write on project_financials
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

alter table project_ideas_phases enable row level security;

create policy project_ideas_phases_select on project_ideas_phases
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
  );

create policy project_ideas_phases_write on project_ideas_phases
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table tasks enable row level security;

create policy tasks_select on tasks
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
    or assignee_id = auth.uid()
  );

-- Operación nunca crea ni borra tareas, solo actualiza el status/horas de las suyas.
create policy tasks_insert on tasks
  for insert to authenticated
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

create policy tasks_update on tasks
  for update to authenticated
  using (
    is_admin()
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
    or (current_user_role() = 'operations' and assignee_id = auth.uid())
  )
  with check (
    is_admin()
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
    or (current_user_role() = 'operations' and assignee_id = auth.uid())
  );

create policy tasks_delete on tasks
  for delete to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table task_dependencies enable row level security;

create policy task_dependencies_rw on task_dependencies
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(
    (select project_id from tasks where id = task_id)
  )))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(
    (select project_id from tasks where id = task_id)
  )));

alter table project_swot enable row level security;

create policy project_swot_select on project_swot
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
  );

create policy project_swot_write on project_swot
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table project_risks enable row level security;

create policy project_risks_select on project_risks
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
  );

create policy project_risks_write on project_risks
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table project_decisions enable row level security;

create policy project_decisions_select on project_decisions
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or (current_user_role() = 'project_manager' and is_project_team_member(project_id))
  );

create policy project_decisions_write on project_decisions
  for all to authenticated
  using (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)))
  with check (is_admin() or (current_user_role() = 'project_manager' and is_project_team_member(project_id)));

alter table comments enable row level security;

create policy comments_select on comments
  for select to authenticated
  using (is_admin() or can_access_entity(entity_type, entity_id));

create policy comments_insert on comments
  for insert to authenticated
  with check (can_access_entity(entity_type, entity_id));

create policy comments_update on comments
  for update to authenticated
  using (is_admin() or author_id = auth.uid())
  with check (is_admin() or author_id = auth.uid());

create policy comments_delete on comments
  for delete to authenticated
  using (is_admin() or author_id = auth.uid());

alter table links enable row level security;

create policy links_select on links
  for select to authenticated
  using (is_admin() or can_access_entity(entity_type, entity_id));

create policy links_insert on links
  for insert to authenticated
  with check (can_access_entity(entity_type, entity_id));

create policy links_delete on links
  for delete to authenticated
  using (is_admin() or created_by = auth.uid());

alter table files enable row level security;

create policy files_select on files
  for select to authenticated
  using (is_admin() or can_access_entity(entity_type, entity_id));

create policy files_insert on files
  for insert to authenticated
  with check (can_access_entity(entity_type, entity_id));

create policy files_delete on files
  for delete to authenticated
  using (is_admin() or uploaded_by = auth.uid());

alter table activity_log enable row level security;

create policy activity_log_select on activity_log
  for select to authenticated
  using (is_admin() or can_access_entity(entity_type, entity_id));

create policy activity_log_insert on activity_log
  for insert to authenticated
  with check (can_access_entity(entity_type, entity_id));

-- ---------------------------------------------------------------------------
-- 4) Conversión Deal -> Proyecto
-- ---------------------------------------------------------------------------
create function convert_deal_to_project(p_deal_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_deal deals%rowtype;
  v_stage pipeline_stages%rowtype;
  v_estimated_direct_cost numeric(14, 2);
  v_project_id uuid;
begin
  if not is_admin() then
    raise exception 'Solo founder/socio pueden convertir un deal en proyecto';
  end if;

  select * into v_deal from deals where id = p_deal_id and deleted_at is null;
  if v_deal.id is null then
    raise exception 'Deal % no encontrado', p_deal_id;
  end if;

  select * into v_stage from pipeline_stages where id = v_deal.stage_id;
  if not v_stage.is_won then
    raise exception 'Solo se pueden convertir deals en la etapa de Closed Won';
  end if;

  if exists (select 1 from projects where deal_id = p_deal_id) then
    raise exception 'Este deal ya tiene un proyecto asociado';
  end if;

  select estimated_direct_cost into v_estimated_direct_cost
  from deal_financials where deal_id = p_deal_id;

  insert into projects (deal_id, account_id, business_line_id, name, start_date, status, created_by)
  values (p_deal_id, v_deal.account_id, v_deal.business_line_id, v_deal.name, current_date, 'planning', auth.uid())
  returning id into v_project_id;

  insert into project_financials (project_id, budget_sold, direct_cost)
  values (v_project_id, v_deal.price, coalesce(v_estimated_direct_cost, 0));

  insert into project_ideas_phases (project_id, phase_id)
  select v_project_id, id from ideas_phases;

  insert into activity_log (entity_type, entity_id, action, actor_id, description)
  values ('project', v_project_id, 'created', auth.uid(), 'Proyecto creado a partir del deal "' || v_deal.name || '"');

  return v_project_id;
end;
$$;

revoke all on function convert_deal_to_project(uuid) from public;
grant execute on function convert_deal_to_project(uuid) to authenticated;
