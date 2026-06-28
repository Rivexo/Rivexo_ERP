-- Vistas de soporte para las graficas del dashboard. Ninguna expone
-- costo/margen (mismas garantias que v_crm_dashboard).
create view v_deals_by_stage with (security_invoker = true) as
select
  s.id as stage_id,
  s.name as stage_name,
  s.color,
  s.order_index,
  s.is_won,
  s.is_lost,
  count(d.id) as deal_count,
  coalesce(sum(d.price), 0) as total_value
from pipeline_stages s
left join deals d on d.stage_id = s.id and d.deleted_at is null
group by s.id, s.name, s.color, s.order_index, s.is_won, s.is_lost
order by s.order_index;

create view v_deals_won_lost_monthly with (security_invoker = true) as
select
  date_trunc('month', d.closed_at)::date as month,
  count(*) filter (where s.is_won) as won_count,
  count(*) filter (where s.is_lost) as lost_count,
  coalesce(sum(d.price) filter (where s.is_won), 0) as won_value
from deals d
join pipeline_stages s on s.id = d.stage_id
where d.closed_at is not null
  and d.closed_at >= date_trunc('month', now()) - interval '11 months'
group by date_trunc('month', d.closed_at)
order by month;
