import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { ForecastSummary } from "@/services/revenues.service";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  invoiced: "Facturado",
  paid: "Cobrado",
};

export function RevenueForecast({ forecast }: { forecast: ForecastSummary }) {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-md border bg-muted/30 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total comprometido</p>
          <p className="text-lg font-semibold">{formatCurrency(forecast.total_committed)}</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Por cobrar este mes</p>
          <p className="text-lg font-semibold">{formatCurrency(forecast.due_this_month)}</p>
        </div>
        <div className="rounded-md border bg-muted/30 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vencido</p>
          <p className={`text-lg font-semibold ${forecast.overdue > 0 ? "text-destructive" : ""}`}>
            {formatCurrency(forecast.overdue)}
          </p>
        </div>
      </div>

      {forecast.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin cuotas pendientes en deals Closed Won.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Deal</TableHead>
              <TableHead>Entregable / Cuota</TableHead>
              <TableHead>Fecha estimada</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecast.rows.map((row) => (
              <TableRow key={row.id} className={row.is_overdue ? "bg-destructive/5" : ""}>
                <TableCell className="font-medium">{row.account_name}</TableCell>
                <TableCell className="text-muted-foreground">{row.deal_name}</TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell>
                  {row.due_date
                    ? new Date(`${row.due_date}T00:00:00`).toLocaleDateString("es-MX")
                    : "—"}
                  {row.is_overdue && (
                    <span className="ml-2 text-xs font-medium text-destructive">Vencida</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(row.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "invoiced" ? "secondary" : "outline"}>
                    {STATUS_LABELS[row.status] ?? row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
