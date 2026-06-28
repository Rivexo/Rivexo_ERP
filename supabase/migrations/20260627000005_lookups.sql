create table business_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on business_lines
  for each row execute function set_updated_at();

alter table business_lines enable row level security;

create policy business_lines_select on business_lines
  for select to authenticated using (true);

create policy business_lines_write on business_lines
  for all to authenticated using (is_admin()) with check (is_admin());

create table pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_index int not null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pipeline_stages_order_idx on pipeline_stages (order_index);

create trigger set_updated_at before update on pipeline_stages
  for each row execute function set_updated_at();

alter table pipeline_stages enable row level security;

create policy pipeline_stages_select on pipeline_stages
  for select to authenticated using (true);

create policy pipeline_stages_write on pipeline_stages
  for all to authenticated using (is_admin()) with check (is_admin());

insert into business_lines (name, slug) values
  ('Deployments', 'deployments'),
  ('Soporte', 'soporte'),
  ('Mini Apps / Notion', 'mini-apps-notion');

insert into pipeline_stages (name, order_index, is_won, is_lost, color) values
  ('Lead', 1, false, false, '#94a3b8'),
  ('Contacto', 2, false, false, '#60a5fa'),
  ('Discovery', 3, false, false, '#818cf8'),
  ('Propuesta', 4, false, false, '#fbbf24'),
  ('Negociación', 5, false, false, '#fb923c'),
  ('Closed Won', 6, true, false, '#22c55e'),
  ('Closed Lost', 7, false, true, '#ef4444');
