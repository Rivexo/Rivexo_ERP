-- ERP: costos fijos/variables, ingresos reales y suscripciones de soporte (MRR).
-- Acceso mas restringido del sistema: solo founder/socio y finanzas (ver matriz de
-- permisos, parrafo 4 de docs/ARCHITECTURE.md). Nadie mas tiene ninguna fila visible.

create type expense_category_kind as enum ('fixed', 'variable');
create type cost_frequency as enum ('monthly', 'annual', 'one_time');
create type subscription_status as enum ('active', 'paused', 'cancelled');

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind expense_category_kind not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table fixed_costs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references expense_categories(id),
  name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  frequency cost_frequency not null default 'monthly',
  effective_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on fixed_costs
  for each row execute function set_updated_at();

create table variable_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  category_id uuid references expense_categories(id),
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table revenues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  amount numeric(14, 2) not null check (amount >= 0),
  received_at date not null default current_date,
  payment_method text,
  related_installment_id uuid references deal_payment_installments(id),
  notes text,
  created_at timestamptz not null default now()
);

create table monthly_support_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  project_id uuid references projects(id),
  amount numeric(14, 2) not null check (amount >= 0),
  billing_day int not null check (billing_day between 1 and 31),
  status subscription_status not null default 'active',
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on monthly_support_subscriptions
  for each row execute function set_updated_at();

create index variable_expenses_project_idx on variable_expenses (project_id);
create index revenues_project_idx on revenues (project_id);
create index monthly_support_subscriptions_account_idx on monthly_support_subscriptions (account_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table expense_categories enable row level security;
alter table fixed_costs enable row level security;
alter table variable_expenses enable row level security;
alter table revenues enable row level security;
alter table monthly_support_subscriptions enable row level security;

-- expense_categories: finanzas necesita leerla (es FK de fixed_costs/variable_expenses,
-- que finanzas si administra), pero solo founder/socio la crea/edita (es un lookup de Settings).
create policy expense_categories_select on expense_categories
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance');

create policy expense_categories_insert on expense_categories
  for insert to authenticated
  with check (is_admin());

create policy expense_categories_update on expense_categories
  for update to authenticated
  using (is_admin())
  with check (is_admin());

create policy fixed_costs_all on fixed_costs
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

create policy variable_expenses_all on variable_expenses
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

create policy revenues_all on revenues
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

create policy monthly_support_subscriptions_all on monthly_support_subscriptions
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- Dashboard financiero
-- ---------------------------------------------------------------------------
create view v_erp_financial_summary with (security_invoker = true) as
select
  (select coalesce(sum(
       case frequency
         when 'monthly' then amount
         when 'annual' then amount / 12
         else 0
       end
     ), 0)
   from fixed_costs
   where is_active
     and effective_date <= current_date
     and (end_date is null or end_date >= current_date)
  ) as monthly_fixed_costs,
  (select coalesce(sum(amount), 0) from variable_expenses
   where expense_date >= date_trunc('month', current_date)
  ) as current_month_variable_expenses,
  (select coalesce(sum(amount), 0) from revenues
   where received_at >= date_trunc('month', current_date)
  ) as current_month_revenue,
  (select coalesce(sum(amount), 0) from monthly_support_subscriptions
   where status = 'active'
  ) as active_mrr;

-- Serie fija de 12 meses (incluye meses sin movimientos en 0) para que la grafica
-- de tendencia no tenga huecos.
create view v_erp_monthly_trend with (security_invoker = true) as
with months as (
  select generate_series(
    date_trunc('month', current_date) - interval '11 months',
    date_trunc('month', current_date),
    interval '1 month'
  )::date as month
)
select
  m.month,
  coalesce((select sum(r.amount) from revenues r where date_trunc('month', r.received_at) = m.month), 0) as revenue,
  coalesce((select sum(v.amount) from variable_expenses v where date_trunc('month', v.expense_date) = m.month), 0) as variable_expenses
from months m
order by m.month;
