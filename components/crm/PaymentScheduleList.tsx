"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentScheduleDialog } from "@/components/crm/PaymentScheduleDialog";
import { formatCurrency } from "@/lib/utils";
import type { InstallmentInput } from "@/lib/validations/installment";
import type { Installment } from "@/services/installments.service";

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", invoiced: "Facturada", paid: "Pagada" };
const STATUS_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  pending: "outline",
  invoiced: "secondary",
  paid: "secondary",
};

export function PaymentScheduleList({
  installments,
  canEdit,
  showGenerateSchedule,
  onCreate,
  onUpdate,
  onDelete,
  onGenerateSchedule,
}: {
  installments: Installment[];
  canEdit: boolean;
  showGenerateSchedule: boolean;
  onCreate: (input: InstallmentInput) => Promise<void>;
  onUpdate: (id: string, input: InstallmentInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onGenerateSchedule: () => Promise<void>;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  async function handleGenerate() {
    setGenerateError(null);
    setIsGenerating(true);
    try {
      await onGenerateSchedule();
      router.refresh();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <PaymentScheduleDialog
            onSubmit={onCreate}
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Nueva cuota
              </Button>
            }
          />
          {showGenerateSchedule && installments.length === 0 && (
            <Button size="sm" variant="outline" disabled={isGenerating} onClick={handleGenerate}>
              <CalendarClock className="size-4" /> {isGenerating ? "Generando..." : "Generar calendario"}
            </Button>
          )}
        </div>
      )}
      {generateError && <p className="text-sm text-destructive">{generateError}</p>}

      {installments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin plan de pagos registrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etiqueta</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((installment) => {
              const isOverdue = installment.status !== "paid" && !!installment.due_date && installment.due_date < today;
              return (
                <TableRow key={installment.id}>
                  <TableCell className="font-medium">{installment.label}</TableCell>
                  <TableCell>{formatCurrency(installment.amount)}</TableCell>
                  <TableCell>
                    {installment.due_date ? new Date(`${installment.due_date}T00:00:00`).toLocaleDateString("es-MX") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={STATUS_VARIANT[installment.status]}>{STATUS_LABELS[installment.status]}</Badge>
                      {isOverdue && <Badge variant="destructive">Vencida</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <PaymentScheduleDialog
                          installment={installment}
                          onSubmit={(input) => onUpdate(installment.id, input)}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Editar cuota">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" aria-label="Eliminar cuota" onClick={() => handleDelete(installment.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
