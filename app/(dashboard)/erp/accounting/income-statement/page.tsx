import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getIncomeStatement } from "@/services/accounting.service";

function defaultRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const end = today.toISOString().slice(0, 10);
  return { start, end };
}

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const params = await searchParams;
  const defaults = defaultRange();
  const start = params.start || defaults.start;
  const end = params.end || defaults.end;

  const statement = await getIncomeStatement(start, end);
  const revenueLines = statement.lines.filter((l) => l.type === "revenue");
  const expenseLines = statement.lines.filter((l) => l.type === "expense");

  return (
    <div className="space-y-6">
      <PageHeader title="Estado de Resultados" description="Ingresos y gastos del periodo, en base de efectivo" />

      <form className="flex items-end gap-4" method="get">
        <div className="space-y-1">
          <Label htmlFor="start">Desde</Label>
          <Input id="start" name="start" type="date" defaultValue={start} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">Hasta</Label>
          <Input id="end" name="end" type="date" defaultValue={end} />
        </div>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {revenueLines.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos.</p>}
            {revenueLines.map((line) => (
              <div key={line.code} className="flex justify-between text-sm">
                <span>{line.name}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1 text-sm font-medium">
              <span>Total ingresos</span>
              <span>{formatCurrency(statement.totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costos y gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {expenseLines.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos.</p>}
            {expenseLines.map((line) => (
              <div key={line.code} className="flex justify-between text-sm">
                <span>{line.name}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1 text-sm font-medium">
              <span>Total costos y gastos</span>
              <span>{formatCurrency(statement.totalExpense)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-sm font-medium">Utilidad neta del periodo</span>
          <span className={`text-xl font-semibold ${statement.netIncome < 0 ? "text-destructive" : ""}`}>
            {formatCurrency(statement.netIncome)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
