"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, HandCoins, Link, Link2Off, Pencil, Plus, RotateCcw, Trash2, Undo2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import type { CostInstallmentInput } from "@/lib/validations/cost-installment";
import type { ProjectCostInstallmentWithRelations } from "@/services/project-cost-schedule.service";
import type { ProjectFinancials } from "@/services/projects.service";
import type { FreelancerInvoiceWithRelations } from "@/services/freelancer-invoices.service";

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", paid: "Pagada" };
const STATUS_VARIANT: Record<string, "outline" | "secondary"> = { pending: "outline", paid: "secondary" };
const PAYEE_LABELS: Record<string, string> = { freelancer: "Freelancer", employee: "Empleado" };

function CostInstallmentDialog({
  installment,
  trigger,
  onSubmit,
}: {
  installment?: ProjectCostInstallmentWithRelations;
  trigger: React.ReactNode;
  onSubmit: (input: CostInstallmentInput) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payeeType, setPayeeType] = useState<"freelancer" | "employee">(
    (installment?.payee_type as "freelancer" | "employee") ?? "freelancer",
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(formRef.current!);
    setIsSubmitting(true);
    try {
      await onSubmit({
        label: String(fd.get("label") || ""),
        amount: Number(fd.get("amount")),
        due_date: (fd.get("due_date") as string) || null,
        notes: (fd.get("notes") as string) || null,
        payee_type: payeeType,
        employee_id: null,
      });
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{installment ? "Editar cuota de costo" : "Nueva cuota de costo"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ci-label">Etiqueta *</Label>
            <Input id="ci-label" name="label" defaultValue={installment?.label} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ci-amount">Monto *</Label>
              <Input id="ci-amount" name="amount" type="number" step="0.01" min={0} defaultValue={installment?.amount} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-due">Vencimiento</Label>
              <Input id="ci-due" name="due_date" type="date" defaultValue={installment?.due_date ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-payee">Beneficiario</Label>
            <Select value={payeeType} onValueChange={(v) => setPayeeType(v as "freelancer" | "employee")}>
              <SelectTrigger id="ci-payee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="employee" disabled>
                  Empleado (próximamente)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-notes">Notas</Label>
            <Input id="ci-notes" name="notes" defaultValue={installment?.notes ?? ""} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : installment ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CostInstallmentTable({
  installments,
  canEdit,
  freelancerInvoices,
  onUpdate,
  onDelete,
  onLinkFreelancerInvoice,
  onUpdateStatus,
}: {
  installments: ProjectCostInstallmentWithRelations[];
  canEdit: boolean;
  freelancerInvoices: FreelancerInvoiceWithRelations[];
  onUpdate: (id: string, input: CostInstallmentInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLinkFreelancerInvoice?: (installmentId: string, invoiceId: string | null) => Promise<void>;
  onUpdateStatus?: (id: string, status: "pending" | "paid") => Promise<void>;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  async function handleLink(installmentId: string, invoiceId: string | null) {
    if (!onLinkFreelancerInvoice) return;
    setLinkingId(installmentId);
    try {
      await onLinkFreelancerInvoice(installmentId, invoiceId);
      router.refresh();
    } finally {
      setLinkingId(null);
    }
  }

  async function handleToggleStatus(id: string, current: string) {
    if (!onUpdateStatus) return;
    setTogglingId(id);
    try {
      await onUpdateStatus(id, current === "paid" ? "pending" : "paid");
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong className="text-foreground tabular-nums">{formatCurrency(total)}</strong>
        </span>
        <span className="text-muted-foreground">
          Pagado: <strong className="text-foreground tabular-nums">{formatCurrency(paid)}</strong>
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etiqueta</TableHead>
            <TableHead>Beneficiario</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead>Factura freelancer</TableHead>
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => {
            const isOverdue = inst.status !== "paid" && !!inst.due_date && inst.due_date < today;
            const isLinking = linkingId === inst.id;
            return (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">
                  {inst.label}
                  {inst.collection_installment && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (← {inst.collection_installment.label})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{PAYEE_LABELS[inst.payee_type] ?? inst.payee_type}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{formatCurrency(inst.amount)}</TableCell>
                <TableCell>
                  {inst.due_date
                    ? new Date(`${inst.due_date}T00:00:00`).toLocaleDateString("es-MX")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canEdit && onUpdateStatus ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs"
                        disabled={togglingId === inst.id}
                        onClick={() => handleToggleStatus(inst.id, inst.status)}
                      >
                        {inst.status === "paid" ? (
                          <>
                            <Undo2 className="size-3" /> Pagada
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3" /> Pendiente
                          </>
                        )}
                      </Button>
                    ) : (
                      <Badge variant={STATUS_VARIANT[inst.status] ?? "outline"}>
                        {STATUS_LABELS[inst.status] ?? inst.status}
                      </Badge>
                    )}
                    {isOverdue && <Badge variant="destructive">Vencida</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {inst.freelancer_invoice ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs rounded-full bg-muted px-2 py-0.5">
                        {inst.freelancer_invoice.freelancer_name} — {formatCurrency(inst.freelancer_invoice.amount)}
                      </span>
                      {canEdit && onLinkFreelancerInvoice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={isLinking}
                          title="Desvincular factura"
                          onClick={() => handleLink(inst.id, null)}
                        >
                          <Link2Off className="size-3" />
                        </Button>
                      )}
                    </div>
                  ) : canEdit && onLinkFreelancerInvoice && freelancerInvoices.length > 0 ? (
                    <Select
                      value=""
                      onValueChange={(v) => { if (v) handleLink(inst.id, v); }}
                      disabled={isLinking}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs">
                        <div className="flex items-center gap-1">
                          <Link className="size-3" />
                          <SelectValue placeholder="Vincular…" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {freelancerInvoices.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.freelancer_name} — {formatCurrency(inv.amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CostInstallmentDialog
                        installment={inst}
                        onSubmit={(input) => onUpdate(inst.id, input)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar cuota de costo">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar cuota de costo"
                        onClick={() => handleDelete(inst.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function CostSchedulePanel({
  financials,
  costInstallments,
  freelancerInvoices,
  canEdit,
  onSetCostPaymentType,
  onCreate,
  onUpdate,
  onDelete,
  onDeleteAll,
  onGenerateSchedule,
  onLinkFreelancerInvoice,
  onUpdateStatus,
}: {
  financials: ProjectFinancials | null;
  costInstallments: ProjectCostInstallmentWithRelations[];
  freelancerInvoices: FreelancerInvoiceWithRelations[];
  canEdit: boolean;
  onSetCostPaymentType: (type: string) => Promise<void>;
  onCreate: (input: CostInstallmentInput) => Promise<void>;
  onUpdate: (id: string, input: CostInstallmentInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onGenerateSchedule: () => Promise<void>;
  onLinkFreelancerInvoice?: (installmentId: string, invoiceId: string | null) => Promise<void>;
  onUpdateStatus?: (id: string, status: "pending" | "paid") => Promise<void>;
}) {
  const router = useRouter();
  const [costTab, setCostTab] = useState<"freelancer" | "employee">("freelancer");
  const [generating, setGenerating] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costType = financials?.cost_payment_type ?? null;

  async function handleSetType(type: string) {
    await onSetCostPaymentType(type);
    router.refresh();
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await onGenerateSchedule();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      await onDeleteAll();
      router.refresh();
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Pago a proveedores</CardTitle>
        {costTab === "freelancer" && costType && canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => handleSetType(costType === "with_collection" ? "custom" : "with_collection")}
          >
            Cambiar a {costType === "with_collection" ? "manual" : "espejo de cobranza"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Tipo de costo tabs */}
        <div className="flex gap-1 border-b pb-3 mb-4">
          <button
            type="button"
            onClick={() => setCostTab("freelancer")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              costTab === "freelancer"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Freelancer
          </button>
          <span
            title="Disponible cuando contrates personal fijo"
            className="inline-flex cursor-not-allowed"
          >
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/40 pointer-events-none"
            >
              <Users className="size-3.5" />
              Empleado
            </button>
          </span>
        </div>
        {costTab === "freelancer" ? (
          !costType ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ¿Cómo se calculará el pago al freelancer?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => handleSetType("with_collection")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                    "hover:border-primary hover:bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <HandCoins className="size-4 text-primary" />
                    Espejo de cobranza
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cuotas proporcionales al plan de cobro del cliente.
                  </p>
                </button>
                <button
                  onClick={() => handleSetType("custom")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                    "hover:border-primary hover:bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Pencil className="size-4 text-primary" />
                    Manual
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define cuotas al freelancer con monto y fecha propios.
                  </p>
                </button>
              </div>
            </div>
          ) : costType === "with_collection" && costInstallments.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Se generará una cuota de costo por cada cuota del plan de cobro del cliente.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {canEdit && (
                <Button size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generando..." : "Generar según cobranza"}
                </Button>
              )}
            </div>
          ) : costType === "with_collection" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                {canEdit && (
                  <Button variant="outline" size="sm" disabled={deletingAll} onClick={handleDeleteAll}>
                    <RotateCcw className="size-4" />
                    {deletingAll ? "Eliminando..." : "Regenerar"}
                  </Button>
                )}
              </div>
              <CostInstallmentTable
                installments={costInstallments}
                canEdit={canEdit}
                freelancerInvoices={freelancerInvoices}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onLinkFreelancerInvoice={onLinkFreelancerInvoice}
                onUpdateStatus={onUpdateStatus}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {canEdit && (
                <CostInstallmentDialog
                  onSubmit={onCreate}
                  trigger={
                    <Button size="sm">
                      <Plus className="size-4" /> Nueva cuota de costo
                    </Button>
                  }
                />
              )}
              {costInstallments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin cuotas de costo registradas.</p>
              ) : (
                <CostInstallmentTable
                  installments={costInstallments}
                  canEdit={canEdit}
                  freelancerInvoices={freelancerInvoices}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onLinkFreelancerInvoice={onLinkFreelancerInvoice}
                  onUpdateStatus={onUpdateStatus}
                />
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Users className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Esta sección estará disponible cuando incorpores personal fijo al equipo.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Las asignaciones de tiempo se registrarán en la tabla <code>time_allocations</code> y se
              reflejarán automáticamente en costos y balance general.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
