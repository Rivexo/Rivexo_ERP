import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProjectFinancials } from "@/services/projects.service";

export function ProjectFinancialsPanel({ financials }: { financials: ProjectFinancials | null }) {
  if (!financials) return null;

  const budgetWithIva = financials.budget_sold * (1 + financials.iva_rate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financieros</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Presupuesto vendido (sin IVA)
          </p>
          <p className="text-sm font-semibold">{formatCurrency(financials.budget_sold)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Con IVA
          </p>
          <p className="text-sm font-semibold">{formatCurrency(budgetWithIva)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
