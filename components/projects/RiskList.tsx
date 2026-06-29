"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskDialog } from "@/components/projects/RiskDialog";
import type { RiskInput } from "@/lib/validations/risk";
import type { ProjectRiskWithRelations } from "@/services/risks.service";
import type { Profile } from "@/services/profiles.service";

const STATUS_LABELS: Record<string, string> = { open: "Abierto", mitigated: "Mitigado", closed: "Cerrado" };
const LEVEL_LABELS: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };
const LEVEL_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export function RiskList({
  risks,
  members,
  canEdit,
  onCreate,
  onUpdate,
  onDelete,
}: {
  risks: ProjectRiskWithRelations[];
  members: Profile[];
  canEdit: boolean;
  onCreate: (input: RiskInput) => Promise<void>;
  onUpdate: (id: string, input: RiskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <RiskDialog
          members={members}
          onSubmit={onCreate}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Nuevo riesgo
            </Button>
          }
        />
      )}

      {risks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin riesgos registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Impacto</TableHead>
              <TableHead>Probabilidad</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="max-w-xs">{risk.description}</TableCell>
                <TableCell>
                  <Badge variant={LEVEL_VARIANT[risk.impact]}>{LEVEL_LABELS[risk.impact]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={LEVEL_VARIANT[risk.probability]}>{LEVEL_LABELS[risk.probability]}</Badge>
                </TableCell>
                <TableCell>{risk.owner?.full_name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[risk.status]}</Badge>
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <RiskDialog
                        risk={risk}
                        members={members}
                        onSubmit={(input) => onUpdate(risk.id, input)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar riesgo">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon" aria-label="Eliminar riesgo" onClick={() => handleDelete(risk.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
