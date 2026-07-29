-- ===========================================================================
-- Fase 8: Portal financiero ERP — corrida de amortización, exhibiciones,
-- beneficiario freelancer/empleado y arquitectura de nómina
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Desglose de amortización y porcentaje de exhibición en cuotas de cobro
-- ---------------------------------------------------------------------------
alter table deal_payment_installments
  add column principal_amount numeric(14, 2),
  add column interest_amount  numeric(14, 2),
  add column percentage       numeric(5, 2) check (percentage > 0 and percentage <= 100);

create index deal_payment_installments_status_due_idx
  on deal_payment_installments (status, due_date);

-- ---------------------------------------------------------------------------
-- 2. Empleados fijos (nómina mensual absorbible en proyectos)
-- ---------------------------------------------------------------------------
create table employees (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid references profiles(id) on delete set null,
  full_name      text not null,
  monthly_salary numeric(14, 2) not null check (monthly_salary >= 0),
  payroll_day    int not null default 15 check (payroll_day between 1 and 31),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table employees enable row level security;

create policy "admin_finance_full_employees"
  on employees for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('founder', 'partner', 'finance')
    )
  );

-- Devengo mensual de nómina: alimenta el pasivo 2300 vía journal
create table payroll_accruals (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references employees(id) on delete cascade,
  period           date not null,
  amount           numeric(14, 2) not null check (amount >= 0),
  journal_entry_id uuid references journal_entries(id),
  created_at       timestamptz not null default now(),
  unique (employee_id, period)
);

alter table payroll_accruals enable row level security;

create policy "admin_finance_full_payroll_accruals"
  on payroll_accruals for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('founder', 'partner', 'finance')
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Beneficiario del plan de pago a proveedores: freelancer o empleado
-- ---------------------------------------------------------------------------
alter table project_cost_installments
  add column payee_type text not null default 'freelancer'
    check (payee_type in ('freelancer', 'employee')),
  add column employee_id uuid references employees(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 4. Asignación de tiempo por porcentaje (absorción de nómina por proyecto)
-- ---------------------------------------------------------------------------
alter table time_allocations
  alter column hours_per_month drop not null,
  add column employee_id uuid references employees(id) on delete cascade,
  add column allocation_pct numeric(5, 2)
    check (allocation_pct > 0 and allocation_pct <= 100),
  add constraint check_allocation_measure
    check (hours_per_month is not null or allocation_pct is not null);

-- ---------------------------------------------------------------------------
-- 5. Cuentas contables de nómina
-- ---------------------------------------------------------------------------
insert into chart_of_accounts (code, name, type) values
  ('2300', 'Nómina por Pagar',    'liability'),
  ('5600', 'Sueldos y Salarios',  'expense')
on conflict (code) do nothing;
