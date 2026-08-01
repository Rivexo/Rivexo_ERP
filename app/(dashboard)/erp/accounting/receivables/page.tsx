import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { MonthlyForecastChart } from "@/components/erp/MonthlyForecastChart";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getAccountsReceivable } from "@/services/installments.service";
import { getIncomeTimeline } from "@/services/revenues.service";

export default async function AccountsReceivablePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [allRows, timeline] = await Promise.all([getAccountsReceivable(), getIncomeTimeline(2)]);
  // Contabilidad solo ve lo ya vencido — el saldo total pendiente (vencido o
  // no) se ve en el portal financiero del proyecto (/erp/projects/[id]).
  const rows = allRows.filter((r) => r.is_overdue);
  const overdueTotal = rows.reduce((sum, r) => sum + r.gross_amount, 0);
  const realTimeline = timeline.filter((row) => !row.is_projected);

  return (
    <div className="space-y-6">
      <PageHeader title="Cuentas por Cobrar" description="Cuotas vencidas de proyectos de contado y financiados" />

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Total vencido</p>
        <p className="text-2xl font-semibold text-destructive">{formatCurrency(overdueTotal)}</p>
      </div>

      <MonthlyForecastChart
        title="Por cobrar real por mes"
        description="Solo compromisos ya generados (sin proyección), deployment vs. soporte"
        rows={realTimeline.map((row) => ({
          month: row.month,
          primary: row.deployment_amount,
          secondary: row.support_amount,
        }))}
        primaryLabel="Deployment"
        secondaryLabel="Soporte"
        primaryColor="#3b82f6"
        secondaryColor="#a855f7"
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay cuotas vencidas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead>Deal / Proyecto</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Monto (c/IVA)</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.account_name}</TableCell>
                <TableCell>
                  <Link href={`/crm/deals/${row.deal_id}`} className="text-primary hover:underline">
                    {row.deal_name}
                  </Link>
                </TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell>{formatCurrency(row.gross_amount)}</TableCell>
                <TableCell>
                  {row.due_date ? new Date(`${row.due_date}T00:00:00`).toLocaleDateString("es-MX") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">Vencida</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
