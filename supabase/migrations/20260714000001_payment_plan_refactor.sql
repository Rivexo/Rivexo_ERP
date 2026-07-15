-- ===========================================================================
-- Fase 7: Refactor de plan de pagos — sincronizar campo legacy is_financed
-- ===========================================================================

-- is_financed era un campo legacy del CRM. payment_type='financing' es el
-- campo canónico. Para datos existentes que tenían is_financed=true pero
-- no tenían payment_type configurado, sincronizamos aquí.
update project_financials
  set payment_type = 'financing'
  where is_financed = true
    and payment_type is null;
