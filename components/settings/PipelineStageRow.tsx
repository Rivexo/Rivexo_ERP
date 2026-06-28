"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";
import type { PipelineStage } from "@/services/pipeline-stages.service";
import { deletePipelineStageAction, moveStageAction } from "@/app/(dashboard)/settings/pipeline-stages/actions";

export function PipelineStageRow({
  stage,
  isFirst,
  isLast,
}: {
  stage: PipelineStage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Badge style={{ backgroundColor: stage.color ?? undefined }} className="text-white">
          {stage.name}
        </Badge>
      </TableCell>
      <TableCell>
        {stage.is_won && <Badge variant="secondary">Ganada</Badge>}
        {stage.is_lost && <Badge variant="outline">Perdida</Badge>}
      </TableCell>
      <TableCell className="flex gap-1">
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={isFirst || isPending}
          onClick={() => startTransition(() => moveStageAction(stage.id, "up"))}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={isLast || isPending}
          onClick={() => startTransition(() => moveStageAction(stage.id, "down"))}
        >
          <ArrowDown className="size-4" />
        </Button>
        <ConfirmDeleteButton
          title="Eliminar etapa"
          description="Solo puede eliminarse si ningún deal la está usando."
          onConfirm={() => deletePipelineStageAction(stage.id)}
        />
      </TableCell>
    </TableRow>
  );
}
