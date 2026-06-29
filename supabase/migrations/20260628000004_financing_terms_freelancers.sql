-- Fase 4 (alcance acordado): financiamiento/credito en deals, soporte por plazos + ARR,
-- y facturas de freelancers. Queda fuera la contabilidad de doble entrada (fase posterior).

-- ---------------------------------------------------------------------------
-- Financiamiento: precio de contado (deals.price, sin tocar) + termino financiado opcional.
-- Vive en `deals`/`project_financials` (no en deal_financials) porque es termino de cobro
-- negociado por Ventas, igual que payment_method/deposit_percentage -- no es costo.
-- ---------------------------------------------------------------------------
alter table deals
  add column is_financed boolean not null default false,
  add column financed_total numeric(14, 2),
  add column financing_term_months int;

alter table project_financials
  add column is_financed boolean not null default false,
  add column financed_total numeric(14, 2),
  add column financing_term_months int;

create or replace function convert_deal_to_project(p_deal_id uuid)
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

  insert into project_financials (
    project_id, budget_sold, direct_cost, iva_rate, is_financed, financed_total, financing_term_months
  )
  values (
    v_project_id, v_deal.price, coalesce(v_estimated_direct_cost, 0), v_deal.iva_rate,
    v_deal.is_financed, v_deal.financed_total, v_deal.financing_term_months
  );

  insert into project_ideas_phases (project_id, phase_id)
  select v_project_id, id from ideas_phases;

  insert into activity_log (entity_type, entity_id, action, actor_id, description)
  values ('project', v_project_id, 'created', auth.uid(), 'Proyecto creado a partir del deal "' || v_deal.name || '"');

  return v_project_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ingresos por intereses/financiamiento (registro manual, sin amortizacion automatica).
-- ---------------------------------------------------------------------------
create type revenue_kind as enum ('principal', 'interest');
alter table revenues add column kind revenue_kind not null default 'principal';

-- ---------------------------------------------------------------------------
-- Soporte: plazo negociado + ciclo de facturacion (MRR vs ARR).
-- ---------------------------------------------------------------------------
create type support_term as enum ('6_months', '1_year', '3_years', 'indefinite');
create type support_billing_cycle as enum ('monthly', 'annual');

alter table monthly_support_subscriptions
  add column term support_term not null default 'indefinite',
  add column billing_cycle support_billing_cycle not null default 'monthly';

create or replace view v_erp_financial_summary with (security_invoker = true) as
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
  (select coalesce(sum(
       case billing_cycle
         when 'monthly' then amount
         when 'annual' then amount / 12
       end
     ), 0)
   from monthly_support_subscriptions
   where status = 'active'
  ) as active_mrr,
  -- Columnas nuevas: deben ir al final, Postgres no permite reordenar columnas
  -- existentes via CREATE OR REPLACE VIEW.
  (select coalesce(sum(amount), 0) from revenues
   where received_at >= date_trunc('month', current_date) and kind = 'interest'
  ) as current_month_financing_income,
  (select coalesce(sum(
       case billing_cycle
         when 'monthly' then amount * 12
         when 'annual' then amount
       end
     ), 0)
   from monthly_support_subscriptions
   where status = 'active'
  ) as active_arr;

-- ---------------------------------------------------------------------------
-- Facturas de freelancers: vive del lado de ERP (admin/finanzas), ligada a un proyecto.
-- ---------------------------------------------------------------------------
create type freelancer_invoice_status as enum ('pending', 'paid');

create table freelancer_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  freelancer_name text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  invoice_date date not null default current_date,
  status freelancer_invoice_status not null default 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index freelancer_invoices_project_idx on freelancer_invoices (project_id);

create trigger set_updated_at before update on freelancer_invoices
  for each row execute function set_updated_at();

alter table freelancer_invoices enable row level security;

create policy freelancer_invoices_all on freelancer_invoices
  for all to authenticated
  using (is_admin() or current_user_role() = 'finance')
  with check (is_admin() or current_user_role() = 'finance');

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
    when 'freelancer_invoice' then (
      is_admin() or current_user_role() = 'finance'
    )
    else is_admin()
  end;
$$;

-- Bucket de Storage separado de `contracts` (CRM/ventas): este es admin/finanzas-only.
insert into storage.buckets (id, name, public)
values ('freelancer-invoices', 'freelancer-invoices', false)
on conflict (id) do nothing;

create policy freelancer_invoices_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'freelancer-invoices' and (is_admin() or current_user_role() = 'finance'));

create policy freelancer_invoices_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'freelancer-invoices' and (is_admin() or current_user_role() = 'finance'));

create policy freelancer_invoices_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'freelancer-invoices' and (is_admin() or current_user_role() = 'finance'));
