import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { JournalEntryWithLines } from "@/services/accounting.service";

const SOURCE_LABELS: Record<string, string> = {
  revenue: "Ingreso",
  variable_expense: "Gasto variable",
  fixed_cost: "Costo fijo",
  freelancer_invoice: "Factura freelancer",
  freelancer_invoice_payment: "Pago freelancer",
  freelancer_invoice_payment_reversal: "Reversión pago freelancer",
  support_billing: "Cobro de soporte",
  manual: "Manual",
};

export function JournalEntryList({ entries }: { entries: JournalEntryWithLines[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">Sin asientos registrados.</p>;

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString("es-MX")}
              </span>
              <span className="text-sm text-muted-foreground">{entry.description}</span>
            </div>
            {entry.source_type && <Badge variant="outline">{SOURCE_LABELS[entry.source_type] ?? entry.source_type}</Badge>}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {entry.lines.map((line) => (
                <tr key={line.id}>
                  <td className="py-0.5 pl-4 text-muted-foreground">
                    {line.account.code} {line.account.name}
                  </td>
                  <td className="w-28 py-0.5 text-right">{line.debit > 0 ? formatCurrency(line.debit) : ""}</td>
                  <td className="w-28 py-0.5 text-right">{line.credit > 0 ? formatCurrency(line.credit) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
