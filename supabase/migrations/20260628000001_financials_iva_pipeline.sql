-- Paridad costo/precio (costo + IVA) y resumen financiero del Pipeline.

create or replace view deal_financials_view with (security_invoker = true) as
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
  round(d.price - f.estimated_direct_cost, 2) as estimated_profit,
  -- Columnas nuevas: deben ir al final, Postgres no permite reordenar columnas
  -- existentes via CREATE OR REPLACE VIEW.
  round(f.estimated_direct_cost * d.iva_rate, 2) as cost_iva_amount,
  round(f.estimated_direct_cost * (1 + d.iva_rate), 2) as cost_with_iva
from deals d
join deal_financials f on f.deal_id = d.id;

-- Los proyectos no tenian IVA propio; se necesita para el calculo de costo+IVA ahi tambien.
alter table project_financials add column iva_rate numeric(5, 4) not null default 0.16;

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

  insert into project_financials (project_id, budget_sold, direct_cost, iva_rate)
  values (v_project_id, v_deal.price, coalesce(v_estimated_direct_cost, 0), v_deal.iva_rate);

  insert into project_ideas_phases (project_id, phase_id)
  select v_project_id, id from ideas_phases;

  insert into activity_log (entity_type, entity_id, action, actor_id, description)
  values ('project', v_project_id, 'created', auth.uid(), 'Proyecto creado a partir del deal "' || v_deal.name || '"');

  return v_project_id;
end;
$$;

-- Resumen agregado del pipeline. total_billing usa solo `deals` (precio ya es visible
-- para ventas); total_contribution_margin hace join a deal_financials (admin/finanzas):
-- para ventas, security_invoker filtra ese join a 0 filas -> da 0, y la UI igual oculta
-- esta cifra a ventas con canViewFinancials (doble seguridad, no solo ocultar en UI).
create view v_pipeline_summary with (security_invoker = true) as
select
  (select coalesce(sum(round(d.price * (1 + d.iva_rate), 2)), 0)
     from deals d where d.deleted_at is null) as total_billing,
  (select coalesce(sum(round(d.price - f.estimated_direct_cost, 2)), 0)
     from deals d join deal_financials f on f.deal_id = d.id
     where d.deleted_at is null) as total_contribution_margin;
