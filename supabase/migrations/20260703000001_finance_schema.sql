-- ===========================================================================
-- Fase 2: Schema de Finanzas — Facturas, Pagos, Periodos de Costos
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Nuevos enums
-- ---------------------------------------------------------------------------
create type invoice_status as enum (
  'borrador', 'emitida', 'parcialmente_pagada', 'pagada', 'cancelada', 'vencida'
);

create type reconciliation_status as enum (
  'pendiente', 'conciliado', 'diferencia', 'rechazado'
);

create type cost_conciliation_status as enum (
  'sin_comprobante', 'con_comprobante', 'conciliado'
);

-- Ampliar installment_status con 'partially_paid'
-- (ADD VALUE no se puede revertir, pero es seguro en migraciones)
alter type installment_status add value if not exists 'partially_paid';

-- ---------------------------------------------------------------------------
-- 2. Tabla customer_invoices (facturas emitidas a clientes)
-- ---------------------------------------------------------------------------
create table customer_invoices (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id),
  account_id      uuid not null references accounts(id),
  folio           text,
  serie           text,
  uuid_fiscal     text,
  issued_at       date not null default current_date,
  due_at          date,
  subtotal        numeric(14, 2) not null check (subtotal >= 0),
  iva_rate        numeric(5, 4) not null default 0.16,
  iva_amount      numeric(14, 2) generated always as (round(subtotal * iva_rate, 2)) stored,
  total           numeric(14, 2) generated always as (round(subtotal * (1 + iva_rate), 2)) stored,
  status          invoice_status not null default 'borrador',
  pdf_path        text,
  xml_path        text,
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index customer_invoices_project_idx on customer_invoices (project_id);
create index customer_invoices_account_idx on customer_invoices (account_id);
create index customer_invoices_status_idx  on customer_invoices (status);

create trigger set_updated_at before update on customer_invoices
  for each row execute function set_updated_at();

alter table customer_invoices enable row level security;

create policy customer_invoices_select on customer_invoices
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance'
         or is_project_team_member(project_id));

create policy customer_invoices_write on customer_invoices
  for all to authenticated
  using  (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- 3. Tabla customer_payments (pagos de clientes recibidos)
-- ---------------------------------------------------------------------------
create table customer_payments (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references projects(id),
  account_id            uuid not null references accounts(id),
  paid_at               date not null default current_date,
  amount                numeric(14, 2) not null check (amount >= 0),
  payment_method        payment_method,
  bank_reference        text,
  bank_account          text,
  receipt_path          text,
  reconciliation_status reconciliation_status not null default 'pendiente',
  notes                 text,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index customer_payments_project_idx on customer_payments (project_id);
create index customer_payments_account_idx on customer_payments (account_id);

create trigger set_updated_at before update on customer_payments
  for each row execute function set_updated_at();

alter table customer_payments enable row level security;

create policy customer_payments_select on customer_payments
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance'
         or is_project_team_member(project_id));

create policy customer_payments_write on customer_payments
  for all to authenticated
  using  (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- 4. Tabla invoice_payments (junction N:M — factura ↔ pago)
-- ---------------------------------------------------------------------------
create table invoice_payments (
  invoice_id     uuid not null references customer_invoices(id) on delete cascade,
  payment_id     uuid not null references customer_payments(id) on delete cascade,
  amount_applied numeric(14, 2) not null check (amount_applied > 0),
  created_at     timestamptz not null default now(),
  primary key (invoice_id, payment_id)
);

create index invoice_payments_payment_idx on invoice_payments (payment_id);

alter table invoice_payments enable row level security;

create policy invoice_payments_select on invoice_payments
  for select to authenticated
  using (
    is_admin() or current_user_role() = 'finance'
    or is_project_team_member((select project_id from customer_invoices where id = invoice_id))
  );

create policy invoice_payments_write on invoice_payments
  for all to authenticated
  using  (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- 5. Tabla fixed_cost_periods (registro mensual de costos fijos + conciliación)
-- ---------------------------------------------------------------------------
create table fixed_cost_periods (
  id                       uuid primary key default gen_random_uuid(),
  fixed_cost_id            uuid not null references fixed_costs(id),
  period                   date not null,           -- primer día del mes
  amount                   numeric(14, 2) not null check (amount >= 0),
  journal_entry_id         uuid references journal_entries(id),
  vendor_invoice_ref       text,
  vendor_invoice_pdf_path  text,
  vendor_invoice_xml_path  text,
  conciliation_status      cost_conciliation_status not null default 'sin_comprobante',
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (fixed_cost_id, period)
);

create index fixed_cost_periods_cost_idx   on fixed_cost_periods (fixed_cost_id);
create index fixed_cost_periods_period_idx on fixed_cost_periods (period);

create trigger set_updated_at before update on fixed_cost_periods
  for each row execute function set_updated_at();

alter table fixed_cost_periods enable row level security;

create policy fixed_cost_periods_select on fixed_cost_periods
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance');

create policy fixed_cost_periods_write on fixed_cost_periods
  for all to authenticated
  using  (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- 6. ALTER project_financials — configuración financiera del proyecto
-- ---------------------------------------------------------------------------
alter table project_financials
  add column if not exists payment_type          text check (payment_type in ('milestones', 'financing')),
  add column if not exists interest_rate_annual  numeric(5, 4),   -- tasa anual en decimal (0.24 = 24%)
  add column if not exists credit_start_date     date,
  add column if not exists down_payment          numeric(14, 2);

-- ---------------------------------------------------------------------------
-- 7. ALTER deal_payment_installments — FK a proyecto y a factura
-- ---------------------------------------------------------------------------
alter table deal_payment_installments
  add column if not exists project_id uuid references projects(id),
  add column if not exists invoice_id uuid references customer_invoices(id);

create index if not exists deal_payment_installments_project_idx
  on deal_payment_installments (project_id);

-- ---------------------------------------------------------------------------
-- 8. ALTER variable_expenses — conciliación con comprobante fiscal
-- ---------------------------------------------------------------------------
alter table variable_expenses
  add column if not exists vendor_invoice_ref      text,
  add column if not exists vendor_invoice_pdf_path text,
  add column if not exists vendor_invoice_xml_path text,
  add column if not exists conciliation_status     cost_conciliation_status not null default 'sin_comprobante';

-- ---------------------------------------------------------------------------
-- 9. Storage buckets (acceso privado)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('invoices',      'invoices',      false),
  ('payments',      'payments',      false),
  ('cost-invoices', 'cost-invoices', false)
on conflict (id) do nothing;

-- Políticas de Storage — invoices
create policy invoices_select on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices' and (is_admin() or current_user_role() = 'finance'));

create policy invoices_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices' and (is_admin() or current_user_role() = 'finance'));

create policy invoices_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'invoices' and is_admin());

-- Políticas de Storage — payments
create policy payments_select on storage.objects
  for select to authenticated
  using (bucket_id = 'payments' and (is_admin() or current_user_role() = 'finance'));

create policy payments_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payments' and (is_admin() or current_user_role() = 'finance'));

create policy payments_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'payments' and is_admin());

-- Políticas de Storage — cost-invoices
create policy cost_invoices_select on storage.objects
  for select to authenticated
  using (bucket_id = 'cost-invoices' and (is_admin() or current_user_role() = 'finance'));

create policy cost_invoices_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cost-invoices' and (is_admin() or current_user_role() = 'finance'));

create policy cost_invoices_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'cost-invoices' and is_admin());

-- ---------------------------------------------------------------------------
-- 10. Nuevas cuentas contables
-- ---------------------------------------------------------------------------
insert into chart_of_accounts (code, name, type) values
  ('1200', 'Cuentas por Cobrar — Clientes', 'asset'),
  ('2200', 'IVA Trasladado por Pagar',       'liability')
on conflict (code) do nothing;
