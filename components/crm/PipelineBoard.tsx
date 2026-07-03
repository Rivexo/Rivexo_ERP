"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import type { PipelineStage } from "@/services/pipeline-stages.service";
import type { DealWithRelations } from "@/services/deals.service";
import { updateDealStageAction } from "@/app/(dashboard)/crm/deals/actions";

function DealCard({ deal }: { deal: DealWithRelations }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("cursor-grab", isDragging && "opacity-50")}>
      <Card>
        <CardContent className="space-y-1 p-2.5">
          <Link href={`/crm/deals/${deal.id}`} className="text-xs font-medium hover:underline">
            {deal.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{deal.account?.name}</p>
          <p className="text-xs font-semibold">{formatCurrency(deal.price)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StageColumn({ stage, deals }: { stage: PipelineStage; deals: DealWithRelations[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + d.price, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn("flex min-w-0 flex-col gap-2 rounded-md border bg-muted/30 p-2.5", isOver && "ring-2 ring-primary")}
    >
      <div className="flex items-center justify-between gap-1">
        <Badge style={{ backgroundColor: stage.color ?? undefined }} className="truncate text-white">
          {stage.name}
        </Badge>
        <span className="shrink-0 text-xs text-muted-foreground">{deals.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({ stages, deals }: { stages: PipelineStage[]; deals: DealWithRelations[] }) {
  const [items, setItems] = useState(deals);
  const [, startTransition] = useTransition();
  const [lostDialog, setLostDialog] = useState<{ dealId: string; stage: PipelineStage } | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [wonDialog, setWonDialog] = useState<{ dealId: string; stage: PipelineStage } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const dealsByStage = useMemo(() => {
    const map = new Map<string, DealWithRelations[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const deal of items) {
      map.get(deal.stage_id)?.push(deal);
    }
    return map;
  }, [items, stages]);

  function moveDeal(dealId: string, stage: PipelineStage, reason?: string) {
    setItems((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stage.id } : d)));
    startTransition(async () => {
      await updateDealStageAction(dealId, { id: stage.id, is_won: stage.is_won, is_lost: stage.is_lost }, reason);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const targetStage = stages.find((s) => s.id === String(over.id));
    const deal = items.find((d) => d.id === dealId);
    if (!targetStage || !deal || deal.stage_id === targetStage.id) return;

    if (targetStage.is_lost) {
      setLostDialog({ dealId, stage: targetStage });
      return;
    }
    if (targetStage.is_won) {
      setWonDialog({ dealId, stage: targetStage });
      return;
    }
    moveDeal(dealId, targetStage);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          className="grid gap-3 overflow-x-auto pb-4"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(160px, 1fr))` }}
        >
          {stages.map((stage) => (
            <StageColumn key={stage.id} stage={stage} deals={dealsByStage.get(stage.id) ?? []} />
          ))}
        </div>
      </DndContext>

      {/* Lost dialog */}
      <Dialog open={!!lostDialog} onOpenChange={(open) => !open && setLostDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo de pérdida</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lost_reason">¿Por qué se perdió este deal?</Label>
            <Input id="lost_reason" value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (lostDialog) moveDeal(lostDialog.dealId, lostDialog.stage, lostReason);
                setLostDialog(null);
                setLostReason("");
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Won dialog — simple confirmation; el plan de pagos se configura en el Proyecto */}
      <Dialog open={!!wonDialog} onOpenChange={(open) => !open && setWonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar como ganado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El deal se moverá a <strong>Closed Won</strong>. El plan de pagos y la configuración
            financiera se definen desde el Proyecto una vez que lo conviertas.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWonDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (wonDialog) moveDeal(wonDialog.dealId, wonDialog.stage);
                setWonDialog(null);
              }}
            >
              Confirmar cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
