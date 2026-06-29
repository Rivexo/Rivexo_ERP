"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FixedCostDialog } from "@/components/erp/FixedCostDialog";
import { formatCurrency } from "@/lib/utils";
import type { FixedCostInput } from "@/lib/validations/fixed-cost";
import type { FixedCostWithRelations } from "@/services/fixed-costs.service";
import type { ExpenseCategory } from "@/services/expense-categories.service";

const FREQUENCY_LABELS: Record<string, string> = { monthly: "Mensual", annual: "Anual", one_time: "Único" };

export function FixedCostList({
  fixedCosts,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: {
  fixedCosts: FixedCostWithRelations[];
  categories: ExpenseCategory[];
  onCreate: (input: FixedCostInput) => Promise<void>;
  onUpdate: (id: string, input: FixedCostInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <FixedCostDialog
        categories={categories}
        onSubmit={onCreate}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Nuevo costo fijo
          </Button>
        }
      />

      {fixedCosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin costos fijos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixedCosts.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell className="font-medium">{cost.name}</TableCell>
                <TableCell>{cost.category?.name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(cost.amount)}</TableCell>
                <TableCell>{FREQUENCY_LABELS[cost.frequency]}</TableCell>
                <TableCell>
                  <Badge variant={cost.is_active ? "secondary" : "outline"}>{cost.is_active ? "Activo" : "Inactivo"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FixedCostDialog
                      fixedCost={cost}
                      categories={categories}
                      onSubmit={(input) => onUpdate(cost.id, input)}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar costo fijo">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" aria-label="Eliminar costo fijo" onClick={() => handleDelete(cost.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
