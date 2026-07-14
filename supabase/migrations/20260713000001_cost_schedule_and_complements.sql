-- ===========================================================================
-- Fase 6: Plan de costos, complemento de pago y arquitectura de empleado fijo
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Complemento de pago CFDI en customer_payments
-- ---------------------------------------------------------------------------
alter table customer_payments
  add column complement_pdf_path text,
  add column complement_xml_path text;

-- ---------------------------------------------------------------------------
-- 2. Tipo de plan de pagos al freelancer en project_financials
-- ---------------------------------------------------------------------------
alter table project_financials
  add column cost_payment_type text
    check (cost_payment_type in ('with_collection', 'custom'));

-- ---------------------------------------------------------------------------
-- 3. Plan de pagos al freelancer (costo directo)
-- ---------------------------------------------------------------------------
create table project_cost_installments (
  id                        uuid primary key default gen_random_uuid(),
  project_id                uuid not null references projects(id) on delete cascade,
  deal_id                   uuid not null references deals(id),
  collection_installment_id uuid references deal_payment_installments(id) on delete set null,
  freelancer_invoice_id     uuid references freelancer_invoices(id) on delete set null,
  label                     text not null,
  amount                    numeric(14, 2) not null check (amount >= 0),
  due_date                  date,
  paid_at                   date,
  status                    text not null default 'pending'
    check (status in ('pending', 'paid')),
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index project_cost_installments_project_idx on project_cost_installments (project_id);
create index project_cost_installments_deal_idx    on project_cost_installments (deal_id);

-- RLS
alter table project_cost_installments enable row level security;

create policy "admin_finance_full_cost_installments"
  on project_cost_installments for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('founder', 'partner', 'finance')
    )
  );

create policy "project_manager_read_cost_installments"
  on project_cost_installments for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'project_manager'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Arquitectura futura: distribución de tiempo de empleado fijo
-- ---------------------------------------------------------------------------
create table time_allocations (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  project_id      uuid references projects(id) on delete cascade,
  subscription_id uuid references monthly_support_subscriptions(id) on delete cascade,
  hours_per_month numeric(6, 2) not null check (hours_per_month > 0),
  effective_from  date not null,
  effective_to    date,
  notes           text,
  created_at      timestamptz not null default now(),
  constraint check_allocation_target
    check (project_id is not null or subscription_id is not null)
);

-- RLS: solo admin
alter table time_allocations enable row level security;

create policy "admin_only_time_allocations"
  on time_allocations for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('founder', 'partner')
    )
  );
