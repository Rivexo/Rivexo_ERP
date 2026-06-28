create table deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_id uuid not null references accounts(id),
  primary_contact_id uuid references contacts(id),
  business_line_id uuid references business_lines(id),
  owner_id uuid references profiles(id),
  stage_id uuid not null references pipeline_stages(id),
  probability int check (probability between 0 and 100),
  expected_close_date date,
  price numeric(14, 2) not null check (price >= 0),
  iva_rate numeric(5, 4) not null default 0.16,
  payment_method payment_method,
  deposit_percentage numeric(5, 2),
  monthly_support_amount numeric(14, 2),
  observations text,
  lost_reason text,
  closed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create index deals_account_idx on deals (account_id);
create index deals_stage_idx on deals (stage_id);
create index deals_owner_idx on deals (owner_id);
create index deals_not_deleted_idx on deals (id) where deleted_at is null;

create trigger set_updated_at before update on deals
  for each row execute function set_updated_at();

alter table deals enable row level security;

create policy deals_select on deals
  for select to authenticated
  using (is_admin() or current_user_role() in ('sales', 'finance'));

create policy deals_write on deals
  for all to authenticated
  using (is_admin() or current_user_role() = 'sales')
  with check (is_admin() or current_user_role() = 'sales');

-- Isolated from `deals` so the cost/margin/profit data can be hidden from `sales`
-- via table-level RLS (Postgres RLS is row-level, not column-level).
create table deal_financials (
  deal_id uuid primary key references deals(id) on delete cascade,
  estimated_direct_cost numeric(14, 2) not null check (estimated_direct_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on deal_financials
  for each row execute function set_updated_at();

alter table deal_financials enable row level security;

create policy deal_financials_rw on deal_financials
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

-- Single source of truth for every derived financial number. Computed here (not as
-- generated columns) because the inputs live in two different tables.
create view deal_financials_view with (security_invoker = true) as
select
  d.id as deal_id,
  d.price,
  d.iva_rate,
  f.estimated_direct_cost,
  round(d.price * d.iva_rate, 2) as iva_amount,
  round(d.price * (1 + d.iva_rate), 2) as total_with_iva,
  round(d.price - f.estimated_direct_cost, 2) as gross_margin,
  case when d.price = 0 then 0
       else round((d.price - f.estimated_direct_cost) / d.price * 100, 2)
  end as margin_pct,
  round(d.price - f.estimated_direct_cost, 2) as estimated_profit
from deals d
join deal_financials f on f.deal_id = d.id;

create table deal_payment_installments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  label text not null,
  due_date date,
  amount numeric(14, 2) not null check (amount >= 0),
  status installment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deal_payment_installments_deal_idx on deal_payment_installments (deal_id);

create trigger set_updated_at before update on deal_payment_installments
  for each row execute function set_updated_at();

alter table deal_payment_installments enable row level security;

create policy deal_payment_installments_select on deal_payment_installments
  for select to authenticated
  using (is_admin() or current_user_role() in ('sales', 'finance'));

create policy deal_payment_installments_write on deal_payment_installments
  for all to authenticated
  using (is_admin() or current_user_role() = 'sales')
  with check (is_admin() or current_user_role() = 'sales');
