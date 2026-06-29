"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { SupportBillingRecordWithRelations } from "@/services/support-billing.service";

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", paid: "Pagado" };

export function SupportBillingPanel({
  records,
  onGenerate,
  onMarkPaid,
}: {
  records: SupportBillingRecordWithRelations[];
  onGenerate: () => Promise<number>;
  onMarkPaid: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function handleGenerate() {
    setIsGenerating(true);
    setMessage(null);
    try {
      const created = await onGenerate();
      setMessage(created > 0 ? `Se generaron ${created} cobros nuevos.` : "Ya existían cobros generados para este mes.");
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleMarkPaid(id: string) {
    await onMarkPaid(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={isGenerating} onClick={handleGenerate}>
          <RefreshCw className="size-4" /> {isGenerating ? "Generando..." : "Generar cobros del mes"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cobros de soporte generados todavía.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const isTransfer = record.subscription?.payment_method === "transferencia";
              const isOverdue = isTransfer && record.status === "pending" && record.due_date < today;
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.subscription?.account?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(`${record.period}T00:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</TableCell>
                  <TableCell>{formatCurrency(record.amount)}</TableCell>
                  <TableCell>{new Date(`${record.due_date}T00:00:00`).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>{record.subscription?.payment_method === "stripe" ? "Stripe" : "Transferencia"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => record.status === "pending" && handleMarkPaid(record.id)}>
                        <Badge variant={record.status === "paid" ? "secondary" : "outline"}>{STATUS_LABELS[record.status]}</Badge>
                      </button>
                      {isOverdue && <Badge variant="destructive">Vencido</Badge>}
                    </div>
                  </TableCell>
                  <TableCell />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
