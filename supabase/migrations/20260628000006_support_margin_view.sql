-- Margen de soporte: ingreso mensual normalizado menos costo directo mensual normalizado,
-- de todas las suscripciones activas. Columna nueva al final (ver nota de Fase 4).
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
  ) as active_arr,
  (select coalesce(sum(
       (case billing_cycle when 'monthly' then amount when 'annual' then amount / 12 end) - direct_cost
     ), 0)
   from monthly_support_subscriptions
   where status = 'active'
  ) as active_support_margin;
