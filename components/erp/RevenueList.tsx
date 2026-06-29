"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueDialog } from "@/components/erp/RevenueDialog";
import { formatCurrency } from "@/lib/utils";
import type { RevenueInput } from "@/lib/validations/revenue";
import type { RevenueWithRelations, InstallmentWithProject } from "@/services/revenues.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const KIND_LABELS: Record<string, string> = { principal: "Principal", interest: "Interés" };

export function RevenueList({
  revenues,
  projects,
  installments,
  onCreate,
  onUpdate,
  onDelete,
}: {
  revenues: RevenueWithRelations[];
  projects: ProjectWithRelations[];
  installments: InstallmentWithProject[];
  onCreate: (input: RevenueInput) => Promise<void>;
  onUpdate: (id: string, input: RevenueInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <RevenueDialog
        projects={projects}
        installments={installments}
        onSubmit={onCreate}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Nuevo ingreso
          </Button>
        }
      />

      {revenues.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin ingresos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Forma de pago</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenues.map((revenue) => (
              <TableRow key={revenue.id}>
                <TableCell className="font-medium">{revenue.project?.name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(revenue.amount)}</TableCell>
                <TableCell>
                  <Badge variant={revenue.kind === "interest" ? "secondary" : "outline"}>{KIND_LABELS[revenue.kind]}</Badge>
                </TableCell>
                <TableCell>{new Date(`${revenue.received_at}T00:00:00`).toLocaleDateString("es-MX")}</TableCell>
                <TableCell>{revenue.payment_method ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <RevenueDialog
                      revenue={revenue}
                      projects={projects}
                      installments={installments}
                      onSubmit={(input) => onUpdate(revenue.id, input)}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar ingreso">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" aria-label="Eliminar ingreso" onClick={() => handleDelete(revenue.id)}>
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
