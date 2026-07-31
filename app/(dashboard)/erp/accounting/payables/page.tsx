import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { MonthlyForecastChart } from "@/components/erp/MonthlyForecastChart";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getAccountsPayable } from "@/services/freelancer-invoices.service";
import { getPayablesForecast } from "@/services/employees.service";

export default async function AccountsPayablePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [rows, payablesForecast] = await Promise.all([getAccountsPayable(), getPayablesForecast(2)]);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const overdueTotal = rows.filter((r) => r.is_overdue).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Cuentas por Pagar" description="Facturas de freelancers pendientes de pago" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total por pagar</p>
          <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Vencido</p>
          <p className="text-2xl font-semibold text-destructive">{formatCurrency(overdueTotal)}</p>
        </div>
      </div>

      <MonthlyForecastChart
        title="Por pagar real por mes"
        description="Solo costo directo ya programado: freelancer vs. empleado absorbido"
        rows={payablesForecast.map((row) => ({
          month: row.month,
          primary: row.freelancer_amount,
          secondary: row.employee_amount,
        }))}
        primaryLabel="Freelancer"
        secondaryLabel="Empleado"
        primaryColor="#f97316"
        secondaryColor="#14b8a6"
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay cuentas por pagar pendientes.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.source}-${row.id}`}>
                <TableCell>
                  <Badge variant="outline">
                    {row.source === "freelancer_invoice" ? "Freelancer" : "Plan de costo"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{row.description}</TableCell>
                <TableCell>{row.project_name}</TableCell>
                <TableCell>{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  {row.due_date ? new Date(`${row.due_date}T00:00:00`).toLocaleDateString("es-MX") : "—"}
                </TableCell>
                <TableCell>{row.is_overdue && <Badge variant="destructive">Vencida</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
