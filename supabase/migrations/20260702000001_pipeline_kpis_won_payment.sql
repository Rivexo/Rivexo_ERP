-- ---------------------------------------------------------------------------
-- 1. Columnas extra en deals para modalidad de pago al cerrar
-- ---------------------------------------------------------------------------
alter table deals
  add column if not exists interest_rate numeric(5, 4),  -- tasa mensual en decimal (p.e. 0.02 = 2%/mes); null si MSI o contado
  add column if not exists is_msi        boolean not null default false; -- Meses Sin Intereses (0% bancario)

-- ---------------------------------------------------------------------------
-- 2. Reemplazar v_pipeline_summary con 4 indicadores:
--    tcv_real      = TCV de deals Closed Won
--    tcv_potencial = TCV de deals activos (ni won ni lost)
--    margin_real   = Margen de contribución Closed Won (requiere deal_financials)
--    margin_potencial = Margen de contribución deals activos
-- ---------------------------------------------------------------------------
drop view if exists v_pipeline_summary;

create view v_pipeline_summary with (security_invoker = true) as
select
  (select coalesce(sum(d.price), 0)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where d.deleted_at is null and s.is_won) as tcv_real,

  (select coalesce(sum(d.price), 0)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where d.deleted_at is null and not s.is_won and not s.is_lost) as tcv_potencial,

  (select coalesce(sum(d.price - f.estimated_direct_cost), 0)
     from deals d
     join pipeline_stages s on s.id = d.stage_id
     join deal_financials f on f.deal_id = d.id
     where d.deleted_at is null and s.is_won) as margin_real,

  (select coalesce(sum(d.price - f.estimated_direct_cost), 0)
     from deals d
     join pipeline_stages s on s.id = d.stage_id
     join deal_financials f on f.deal_id = d.id
     where d.deleted_at is null and not s.is_won and not s.is_lost) as margin_potencial;
