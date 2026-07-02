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
import { PlusIcon, Trash2Icon } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import type { PipelineStage } from "@/services/pipeline-stages.service";
import type { DealWithRelations } from "@/services/deals.service";
import { updateDealStageAction, updateDealStageWonAction } from "@/app/(dashboard)/crm/deals/actions";
import type { WonPaymentInput } from "@/lib/validations/deal";

const PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
] as const;

type ContadoRow = { label: string; due_date: string; amount: string };

type WonDialogState = {
  dealId: string;
  dealPrice: number;
  stage: PipelineStage;
};

function WonDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: WonDialogState;
  onClose: () => void;
  onConfirm: (payment: WonPaymentInput) => void;
}) {
  const [modalidad, setModalidad] = useState<"contado" | "financiamiento">("contado");

  // Contado state
  const [paymentMethod, setPaymentMethod] = useState<"transferencia" | "tarjeta" | "efectivo" | "cheque" | "otro">("transferencia");
  const [rows, setRows] = useState<ContadoRow[]>([{ label: "", due_date: "", amount: String(state.dealPrice) }]);

  // Financiamiento state
  const [isMsi, setIsMsi] = useState(false);
  const [interestRate, setInterestRate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [financedTotal, setFinancedTotal] = useState(String(state.dealPrice));

  function addRow() {
    setRows((r) => [...r, { label: "", due_date: "", amount: "" }]);
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof ContadoRow, value: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function handleConfirm() {
    if (modalidad === "contado") {
      onConfirm({
        modalidad: "contado",
        payment_method: paymentMethod,
        installments: rows.map((r) => ({
          label: r.label,
          due_date: r.due_date || undefined,
          amount: Number(r.amount),
        })),
      });
    } else {
      onConfirm({
        modalidad: "financiamiento",
        is_msi: isMsi,
        interest_rate: isMsi ? null : (interestRate ? Number(interestRate) : null),
        financing_term_months: Number(termMonths),
        financed_total: Number(financedTotal),
      });
    }
  }

  const canConfirm =
    modalidad === "contado"
      ? rows.length > 0 && rows.every((r) => r.label && Number(r.amount) >= 0)
      : Number(termMonths) >= 1 && Number(financedTotal) >= 0;

  // Preview monthly payment for financing
  const monthlyPreview = (() => {
    if (modalidad !== "financiamiento" || !termMonths || !financedTotal) return null;
    const P = Number(financedTotal);
    const n = Number(termMonths);
    const r = isMsi ? 0 : (Number(interestRate) || 0) / 100;
    if (n < 1 || P <= 0) return null;
    if (r === 0) return P / n;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  })();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modalidad de pago — Closed Won</DialogTitle>
        </DialogHeader>

        {/* Modalidad selector */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={modalidad === "contado" ? "default" : "outline"}
            onClick={() => setModalidad("contado")}
          >
            De contado
          </Button>
          <Button
            size="sm"
            variant={modalidad === "financiamiento" ? "default" : "outline"}
            onClick={() => setModalidad("financiamiento")}
          >
            Financiamiento
          </Button>
        </div>

        {modalidad === "contado" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Label>Cuotas / Entregables</Label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_130px_100px_auto] items-center gap-2">
                  <Input
                    placeholder="Entregable"
                    value={row.label}
                    onChange={(e) => updateRow(i, "label", e.target.value)}
                  />
                  <Input
                    type="date"
                    value={row.due_date}
                    onChange={(e) => updateRow(i, "due_date", e.target.value)}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Importe"
                    value={row.amount}
                    onChange={(e) => updateRow(i, "amount", e.target.value)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeRow(i)} disabled={rows.length === 1}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={addRow}>
              <PlusIcon className="size-4 mr-1" /> Agregar cuota
            </Button>
          </div>
        )}

        {modalidad === "financiamiento" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!isMsi ? "default" : "outline"}
                onClick={() => setIsMsi(false)}
              >
                Con tasa
              </Button>
              <Button
                size="sm"
                variant={isMsi ? "default" : "outline"}
                onClick={() => setIsMsi(true)}
              >
                MSI (0%)
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Total a financiar</Label>
                <Input
                  type="number"
                  min={0}
                  value={financedTotal}
                  onChange={(e) => setFinancedTotal(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Número de meses</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="p.e. 12"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                />
              </div>
            </div>

            {!isMsi && (
              <div className="space-y-1">
                <Label>Tasa mensual (%)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="p.e. 2.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
            )}

            {monthlyPreview !== null && (
              <p className="text-sm text-muted-foreground">
                Cuota mensual estimada:{" "}
                <span className="font-semibold text-foreground">{formatCurrency(monthlyPreview)}</span>
                {" "}×{" "}{termMonths} meses
                {isMsi && " (MSI — sin intereses)"}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Confirmar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [wonDialog, setWonDialog] = useState<WonDialogState | null>(null);

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

  function moveDealWon(dealId: string, stage: PipelineStage, payment: WonPaymentInput) {
    setItems((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stage.id } : d)));
    startTransition(async () => {
      await updateDealStageWonAction(dealId, { id: stage.id, is_won: stage.is_won, is_lost: stage.is_lost }, payment);
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
      setWonDialog({ dealId, dealPrice: deal.price, stage: targetStage });
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

      {/* Won dialog */}
      {wonDialog && (
        <WonDialog
          state={wonDialog}
          onClose={() => setWonDialog(null)}
          onConfirm={(payment) => {
            moveDealWon(wonDialog.dealId, wonDialog.stage, payment);
            setWonDialog(null);
          }}
        />
      )}
    </>
  );
}
