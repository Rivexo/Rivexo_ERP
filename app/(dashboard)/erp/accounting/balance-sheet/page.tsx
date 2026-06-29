import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getBalanceSheet } from "@/services/accounting.service";

export default async function BalanceSheetPage({ searchParams }: { searchParams: Promise<{ asOf?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const params = await searchParams;
  const asOf = params.asOf || new Date().toISOString().slice(0, 10);

  const balance = await getBalanceSheet(asOf);

  return (
    <div className="space-y-6">
      <PageHeader title="Balance General" description="Activo = Pasivo + Capital, a una fecha" />

      <form className="flex items-end gap-4" method="get">
        <div className="space-y-1">
          <Label htmlFor="asOf">A la fecha</Label>
          <Input id="asOf" name="asOf" type="date" defaultValue={asOf} />
        </div>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Caja y Bancos</span>
              <span>{formatCurrency(balance.cash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cuentas por Cobrar</span>
              <span>{formatCurrency(balance.accountsReceivable)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-sm font-medium">
              <span>Total activo</span>
              <span>{formatCurrency(balance.totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pasivo + Capital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Cuentas por Pagar - Freelancers</span>
              <span>{formatCurrency(balance.accountsPayable)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Resultados Acumulados</span>
              <span>{formatCurrency(balance.retainedEarnings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cuentas por Cobrar (pendientes de cobro)</span>
              <span>{formatCurrency(balance.accountsReceivable)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 text-sm font-medium">
              <span>Total pasivo + capital</span>
              <span>{formatCurrency(balance.totalLiabilities + balance.totalEquity)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        No hay activos fijos ni depreciación todavía, así que Caja y Cuentas por Cobrar son los únicos activos del
        negocio. La Cuenta por Cobrar se refleja también como renglón de capital porque ese ingreso aún no se ha
        cobrado (no se reconoce como utilidad hasta que entra a Caja); el detalle por cuota está en{" "}
        <span className="font-medium">Cuentas por Cobrar</span>.
      </p>
    </div>
  );
}
