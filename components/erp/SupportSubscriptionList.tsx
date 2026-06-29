"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupportSubscriptionDialog } from "@/components/erp/SupportSubscriptionDialog";
import { formatCurrency } from "@/lib/utils";
import type { SupportSubscriptionInput } from "@/lib/validations/support-subscription";
import type { SupportSubscriptionWithRelations } from "@/services/support-subscriptions.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const STATUS_LABELS: Record<string, string> = { active: "Activa", paused: "Pausada", cancelled: "Cancelada" };
const STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  paused: "outline",
  cancelled: "destructive",
};

export function SupportSubscriptionList({
  subscriptions,
  accounts,
  projects,
  onCreate,
  onUpdate,
  onDelete,
}: {
  subscriptions: SupportSubscriptionWithRelations[];
  accounts: { id: string; name: string }[];
  projects: ProjectWithRelations[];
  onCreate: (input: SupportSubscriptionInput) => Promise<void>;
  onUpdate: (id: string, input: SupportSubscriptionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SupportSubscriptionDialog
        accounts={accounts}
        projects={projects}
        onSubmit={onCreate}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Nueva suscripción
          </Button>
        }
      />

      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin suscripciones de soporte registradas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Día de cobro</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.account?.name ?? "—"}</TableCell>
                <TableCell>{sub.project?.name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(sub.amount)}</TableCell>
                <TableCell>{sub.billing_day}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[sub.status]}>{STATUS_LABELS[sub.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <SupportSubscriptionDialog
                      subscription={sub}
                      accounts={accounts}
                      projects={projects}
                      onSubmit={(input) => onUpdate(sub.id, input)}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Editar suscripción">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" aria-label="Eliminar suscripción" onClick={() => handleDelete(sub.id)}>
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
