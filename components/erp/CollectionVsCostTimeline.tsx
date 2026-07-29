import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { CashflowComparisonRow } from "@/services/erp-projects.service";

const MONTH_LABEL = new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric" });

function formatMonth(month: string): string {
  return MONTH_LABEL.format(new Date(`${month}-01T00:00:00`));
}

export function CollectionVsCostTimeline({ rows }: { rows: CashflowComparisonRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cobro vs. pago a proveedores</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Cobro</TableHead>
              <TableHead className="text-right">Pago a proveedores</TableHead>
              <TableHead className="text-right">Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium capitalize">{formatMonth(row.month)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(row.collected)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(row.paid)}</TableCell>
                <TableCell
                  className={
                    "text-right tabular-nums font-semibold " +
                    (row.net >= 0 ? "text-emerald-600" : "text-destructive")
                  }
                >
                  {formatCurrency(row.net)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
