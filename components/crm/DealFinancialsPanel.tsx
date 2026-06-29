import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DealFinancials } from "@/services/deals.service";

export function DealFinancialsPanel({ financials }: { financials: DealFinancials | null }) {
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
