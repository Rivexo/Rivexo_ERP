import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ProjectFinancials } from "@/services/projects.service";

export function ProjectFinancialsPanel({ financials }: { financials: ProjectFinancials | null }) {
  if (!financials) {
    return null;
  }

  const grossMargin = financials.budget_sold - financials.direct_cost;
  const marginPct = financials.budget_sold === 0 ? 0 : (grossMargin / financials.budget_sold) * 100;

  const items = [
    { label: "Presupuesto vendido", value: formatCurrency(financials.budget_sold) },
    { label: "Costo directo", value: formatCurrency(financials.direct_cost) },
    { label: "Margen bruto", value: formatCurrency(grossMargin) },
    { label: "Margen %", value: formatPercent(marginPct) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financieros</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
