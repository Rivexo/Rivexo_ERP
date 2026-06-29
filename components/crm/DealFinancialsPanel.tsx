import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DealFinancials, Deal } from "@/services/deals.service";

export function DealFinancialsPanel({ financials, deal }: { financials: DealFinancials | null; deal?: Deal }) {
  if (!financials) {
    return null;
  }

  const items = [
    { label: "Costo directo estimado (sin IVA)", value: formatCurrency(financials.estimated_direct_cost) },
    { label: "Costo con IVA", value: formatCurrency(financials.cost_with_iva) },
    { label: "IVA", value: formatCurrency(financials.iva_amount) },
    { label: "Total con IVA", value: formatCurrency(financials.total_with_iva) },
    { label: "Margen bruto", value: formatCurrency(financials.gross_margin) },
    { label: "Margen %", value: formatPercent(financials.margin_pct) },
    { label: "Utilidad estimada", value: formatCurrency(financials.estimated_profit) },
  ];

  if (deal?.is_financed) {
    items.push(
      { label: "Total financiado", value: formatCurrency(deal.financed_total ?? 0) },
      { label: "Plazo", value: `${deal.financing_term_months ?? 0} meses` },
      { label: "Ingreso por financiamiento", value: formatCurrency((deal.financed_total ?? 0) - deal.price) },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financieros</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
