import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ProjectFinancials } from "@/services/projects.service";

export function ProjectFinancialsPanel({ financials }: { financials: ProjectFinancials | null }) {
  if (!financials) {
    return null;
  }

  const grossMargin = financials.budget_sold - financials.direct_cost;
  const marginPct = financials.budget_sold === 0 ? 0 : (grossMargin / financials.budget_sold) * 100;
  const costWithIva = financials.direct_cost * (1 + financials.iva_rate);
  const budgetWithIva = financials.budget_sold * (1 + financials.iva_rate);

  const items = [
    { label: "Presupuesto vendido (sin IVA)", value: formatCurrency(financials.budget_sold) },
    { label: "Presupuesto con IVA", value: formatCurrency(budgetWithIva) },
    { label: "Costo directo (sin IVA)", value: formatCurrency(financials.direct_cost) },
    { label: "Costo con IVA", value: formatCurrency(costWithIva) },
    { label: "Margen bruto", value: formatCurrency(grossMargin) },
    { label: "Margen %", value: formatPercent(marginPct) },
  ];

  if (financials.is_financed) {
    items.push(
      { label: "Total financiado", value: formatCurrency(financials.financed_total ?? 0) },
      { label: "Plazo", value: `${financials.financing_term_months ?? 0} meses` },
      { label: "Ingreso por financiamiento", value: formatCurrency((financials.financed_total ?? 0) - financials.budget_sold) },
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
