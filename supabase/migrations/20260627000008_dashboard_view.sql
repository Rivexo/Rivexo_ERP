-- Aggregate-only view: no cost/margin columns are ever exposed here, and
-- security_invoker means each subquery still runs under the caller's own RLS.
create view v_crm_dashboard with (security_invoker = true) as
select
  (select count(*) from accounts where deleted_at is null) as total_accounts,
  (select count(*)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where d.deleted_at is null and not s.is_won and not s.is_lost) as open_deals_count,
  (select coalesce(sum(d.price), 0)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where d.deleted_at is null and not s.is_won and not s.is_lost) as pipeline_value,
  (select count(*)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where s.is_won and d.closed_at >= date_trunc('month', now())) as deals_won_this_month,
  (select coalesce(sum(d.price), 0)
     from deals d join pipeline_stages s on s.id = d.stage_id
     where s.is_won and d.closed_at >= date_trunc('month', now())) as revenue_won_this_month;
