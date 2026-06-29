import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getCashFlowStatement } from "@/services/accounting.service";

function defaultRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const end = today.toISOString().slice(0, 10);
  return { start, end };
}

export default async function CashFlowPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const params = await searchParams;
  const defaults = defaultRange();
  const start = params.start || defaults.start;
  const end = params.end || defaults.end;

  const cashFlow = await getCashFlowStatement(start, end);

  return (
    <div className="space-y-6">
      <PageHeader title="Flujo de Efectivo" description="Entradas y salidas de caja del periodo" />

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
            <CardTitle>Entradas de efectivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {cashFlow.inflows.length === 0 && <p className="text-sm text-muted-foreground">Sin entradas.</p>}
            {cashFlow.inflows.map((line) => (
              <div key={line.code} className="flex justify-between text-sm">
                <span>{line.name}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salidas de efectivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {cashFlow.outflows.length === 0 && <p className="text-sm text-muted-foreground">Sin salidas.</p>}
            {cashFlow.outflows.map((line) => (
              <div key={line.code} className="flex justify-between text-sm">
                <span>{line.name}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-1 py-4">
          <div className="flex justify-between text-sm">
            <span>Caja inicial</span>
            <span>{formatCurrency(cashFlow.openingCash)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Flujo neto de operación</span>
            <span>{formatCurrency(cashFlow.netOperating)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 text-sm font-medium">
            <span>Caja final</span>
            <span>{formatCurrency(cashFlow.closingCash)}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Actividades de inversión y financiamiento: $0 — no aplica todavía en el negocio.
      </p>
    </div>
  );
}
