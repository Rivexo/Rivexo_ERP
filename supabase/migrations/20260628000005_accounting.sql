-- Fase 5: motor contable de doble entrada (chart_of_accounts, journal_entries, journal_lines),
-- mas los huecos que se necesitan para que CxC/CxP y soporte funcionen.

-- ---------------------------------------------------------------------------
-- Catalogo de cuentas
-- ---------------------------------------------------------------------------
create type account_type as enum ('asset', 'liability', 'equity', 'revenue', 'expense');

create table chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type account_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into chart_of_accounts (code, name, type) values
  ('1100', 'Caja y Bancos', 'asset'),
  ('2100', 'Cuentas por Pagar - Freelancers', 'liability'),
  ('3100', 'Resultados Acumulados', 'equity'),
  ('4100', 'Ingresos por Proyectos', 'revenue'),
  ('4200', 'Ingresos por Soporte', 'revenue'),
  ('4300', 'Ingresos por Financiamiento', 'revenue'),
  ('5100', 'Costo Directo de Proyectos', 'expense'),
  ('5200', 'Costo Directo de Soporte', 'expense'),
  ('5300', 'Gastos Variables', 'expense'),
  ('5400', 'Costos Fijos', 'expense'),
  ('5500', 'Gastos de Freelancers', 'expense');

-- ---------------------------------------------------------------------------
-- Diario: journal_entries / journal_lines, en base de efectivo (se postea cuando
-- el efectivo realmente se mueve). Inmutable una vez creado: solo select+insert,
-- sin update/delete -- una correccion se hace con un asiento de reversion, nunca
-- editando el original (practica contable estandar).
-- ---------------------------------------------------------------------------
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  description text not null,
  source_type text,
  source_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index journal_entries_date_idx on journal_entries (entry_date);
create index journal_entries_source_idx on journal_entries (source_type, source_id);

create table journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references chart_of_accounts(id),
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  check (not (debit > 0 and credit > 0)),
  check (debit > 0 or credit > 0)
);

create index journal_lines_entry_idx on journal_lines (journal_entry_id);
create index journal_lines_account_idx on journal_lines (account_id);

-- Verifica, a nivel statement (con transition table), que cada asiento tocado
-- por el INSERT quede balanceado: rechaza el lote completo si no.
create or replace function check_journal_balance()
returns trigger
language plpgsql
as $$
declare
  v_entry_id uuid;
  v_diff numeric;
begin
  for v_entry_id in select distinct journal_entry_id from new_rows
  loop
    select coalesce(sum(debit), 0) - coalesce(sum(credit), 0) into v_diff
    from journal_lines where journal_entry_id = v_entry_id;

    if v_diff <> 0 then
      raise exception 'El asiento % no esta balanceado (diferencia: %)', v_entry_id, v_diff;
    end if;
  end loop;
  return null;
end;
$$;

create trigger journal_lines_balance_check
  after insert on journal_lines
  referencing new table as new_rows
  for each statement
  execute function check_journal_balance();

alter table chart_of_accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_lines enable row level security;

create policy chart_of_accounts_select on chart_of_accounts
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance');

create policy chart_of_accounts_write on chart_of_accounts
  for insert to authenticated
  with check (is_admin());

create policy journal_entries_select on journal_entries
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance');

create policy journal_entries_insert on journal_entries
  for insert to authenticated
  with check (is_admin() or current_user_role() = 'finance');

create policy journal_lines_select on journal_lines
  for select to authenticated
  using (is_admin() or current_user_role() = 'finance');

create policy journal_lines_insert on journal_lines
  for insert to authenticated
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- Soporte: metodo de pago (para saber cuales se pueden marcar "vencidas" por
-- transferencia) + costo directo (para margen, igual que project_financials).
-- ---------------------------------------------------------------------------
create type support_payment_method as enum ('stripe', 'transferencia');

alter table monthly_support_subscriptions
  add column payment_method support_payment_method not null default 'transferencia',
  add column direct_cost numeric(14, 2) not null default 0;

-- Cobro esperado de cada suscripcion por periodo (mes). Permite saber que
-- transferencias estan vencidas sin necesitar integracion real con Stripe todavia.
create type support_billing_status as enum ('pending', 'paid');

create table support_billing_records (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references monthly_support_subscriptions(id),
  period date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date date not null,
  status support_billing_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (subscription_id, period)
);

create index support_billing_records_subscription_idx on support_billing_records (subscription_id);

alter table support_billing_records enable row level security;

create policy support_billing_records_all on support_billing_records
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- ---------------------------------------------------------------------------
-- CxP: fecha de vencimiento de la factura de freelancer.
-- ---------------------------------------------------------------------------
alter table freelancer_invoices add column due_date date;
