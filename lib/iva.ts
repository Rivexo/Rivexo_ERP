// Los montos de cuotas (deal_payment_installments, project_cost_installments) se
// guardan netos (sin IVA), igual que budget_sold/direct_cost en todo el sistema.
// El IVA se calcula al vuelo con project_financials.iva_rate, no se guarda
// snapshoteado — así como deal_financials_view lo hace para el CRM.
export function calcIvaBreakdown(net: number, ivaRate: number): { ivaAmount: number; total: number } {
  const ivaAmount = Math.round(net * ivaRate * 100) / 100;
  const total = Math.round((net + ivaAmount) * 100) / 100;
  return { ivaAmount, total };
}
