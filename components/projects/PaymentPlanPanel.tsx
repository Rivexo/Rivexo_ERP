"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ListChecks, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentScheduleDialog } from "@/components/crm/PaymentScheduleDialog";
import { cn, formatCurrency } from "@/lib/utils";
import { financingConfigSchema, type FinancingConfigFormValues, type FinancingConfigInput } from "@/lib/validations/project-payment";
import type { InstallmentInput } from "@/lib/validations/installment";
import type { Installment } from "@/services/installments.service";
import type { ProjectFinancials } from "@/services/projects.service";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  invoiced: "Facturada",
  partially_paid: "Parcialmente pagada",
  paid: "Pagada",
};
const STATUS_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  pending: "outline",
  invoiced: "secondary",
  partially_paid: "secondary",
  paid: "secondary",
};

function calcPmt(principal: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0 || n === 0) return n ? principal / n : 0;
  const factor = Math.pow(1 + monthlyRate, n);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function FinancingForm({
  financials,
  onGenerate,
}: {
  financials: ProjectFinancials;
  onGenerate: (config: FinancingConfigInput) => Promise<void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const defaultTerm = financials.financing_term_months ?? 12;
  const defaultRate = financials.interest_rate_annual != null ? financials.interest_rate_annual * 100 : 0;
  const defaultDown = financials.down_payment ?? 0;
  const defaultStart = financials.credit_start_date ?? "";

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FinancingConfigFormValues, unknown, FinancingConfigInput>({
    resolver: zodResolver(financingConfigSchema),
    defaultValues: {
      financing_term_months: defaultTerm,
      interest_rate_annual_pct: defaultRate,
      credit_start_date: defaultStart,
      down_payment: defaultDown,
    },
  });

  const watchedValues = watch();
  const down = Number(watchedValues.down_payment) || 0;
  const principal = Math.max(0, financials.budget_sold - down);
  const r = (Number(watchedValues.interest_rate_annual_pct) || 0) / 100 / 12;
  const n = Number(watchedValues.financing_term_months) || 0;
  const pmt = calcPmt(principal, r, n);

  async function submit(values: FinancingConfigInput) {
    setError(null);
    try {
      await onGenerate(values);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="financing_term_months">Plazo (meses) *</Label>
          <Input id="financing_term_months" type="number" min={1} {...register("financing_term_months")} />
          {errors.financing_term_months && (
            <p className="text-sm text-destructive">{errors.financing_term_months.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest_rate_annual_pct">Tasa anual (%)</Label>
          <Input
            id="interest_rate_annual_pct"
            type="number"
            step="0.01"
            min={0}
            max={100}
            placeholder="0 = MSI"
            {...register("interest_rate_annual_pct")}
          />
          {errors.interest_rate_annual_pct && (
            <p className="text-sm text-destructive">{errors.interest_rate_annual_pct.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit_start_date">Fecha de inicio</Label>
          <Input id="credit_start_date" type="date" {...register("credit_start_date")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="down_payment">Enganche</Label>
          <Input id="down_payment" type="number" step="0.01" min={0} placeholder="0" {...register("down_payment")} />
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Precio base</span>
          <span className="tabular-nums font-medium text-foreground">{formatCurrency(financials.budget_sold)}</span>
        </div>
        {down > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Enganche</span>
            <span className="tabular-nums font-medium text-foreground">{formatCurrency(down)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Saldo a financiar</span>
          <span className="tabular-nums font-medium text-foreground">{formatCurrency(principal)}</span>
        </div>
        {n > 0 && (
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span>Cuota mensual estimada</span>
            <span className="tabular-nums">{formatCurrency(pmt)}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        <CalendarClock className="size-4" />
        {isSubmitting ? "Generando..." : "Generar calendario"}
      </Button>
    </form>
  );
}

function InstallmentTable({
  installments,
  canEdit,
  onUpdate,
  onDelete,
}: {
  installments: Installment[];
  canEdit: boolean;
  onUpdate: (id: string, input: InstallmentInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const total = installments.reduce((s, i) => s + i.amount, 0);
  const paid = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong className="text-foreground tabular-nums">{formatCurrency(total)}</strong>
        </span>
        <span className="text-muted-foreground">
          Cobrado: <strong className="text-foreground tabular-nums">{formatCurrency(paid)}</strong>
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etiqueta</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estatus</TableHead>
            {canEdit && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => {
            const isOverdue = inst.status !== "paid" && !!inst.due_date && inst.due_date < today;
            return (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">{inst.label}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(inst.amount)}</TableCell>
                <TableCell>
                  {inst.due_date
                    ? new Date(`${inst.due_date}T00:00:00`).toLocaleDateString("es-MX")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge variant={STATUS_VARIANT[inst.status] ?? "outline"}>
                      {STATUS_LABELS[inst.status] ?? inst.status}
                    </Badge>
                    {isOverdue && <Badge variant="destructive">Vencida</Badge>}
                  </div>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <PaymentScheduleDialog
                        installment={inst}
                        onSubmit={(input) => onUpdate(inst.id, input)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar cuota">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar cuota"
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

export function PaymentPlanPanel({
  financials,
  installments,
  projectId,
  dealId,
  canEdit,
  onSetPaymentType,
  onCreate,
  onUpdate,
  onDelete,
  onDeleteAll,
  onGenerateSchedule,
}: {
  financials: ProjectFinancials | null;
  installments: Installment[];
  projectId: string;
  dealId: string;
  canEdit: boolean;
  onSetPaymentType: (type: "milestones" | "financing") => Promise<void>;
  onCreate: (input: InstallmentInput) => Promise<void>;
  onUpdate: (id: string, input: InstallmentInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onGenerateSchedule: (config: FinancingConfigInput) => Promise<void>;
}) {
  const router = useRouter();
  const [deletingAll, setDeletingAll] = useState(false);

  const paymentType = financials?.payment_type ?? null;

  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      await onDeleteAll();
      router.refresh();
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleSetType(type: "milestones" | "financing") {
    await onSetPaymentType(type);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Plan de pagos</CardTitle>
        {paymentType && canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => handleSetType(paymentType === "milestones" ? "financing" : "milestones")}
          >
            Cambiar a {paymentType === "milestones" ? "financiamiento" : "parcialidades"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!paymentType ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Elige cómo se estructurará el cobro de este proyecto.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => handleSetType("milestones")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <ListChecks className="size-4 text-primary" />
                  Parcialidades
                </div>
                <p className="text-sm text-muted-foreground">
                  Define cuotas personalizadas con etiqueta, monto y fecha.
                </p>
              </button>
              <button
                onClick={() => handleSetType("financing")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <CalendarClock className="size-4 text-primary" />
                  Financiamiento
                </div>
                <p className="text-sm text-muted-foreground">
                  Genera un calendario de amortización con tasa de interés.
                </p>
              </button>
            </div>
          </div>
        ) : paymentType === "milestones" ? (
          <div className="space-y-4">
            {canEdit && (
              <PaymentScheduleDialog
                onSubmit={onCreate}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" /> Nueva cuota
                  </Button>
                }
              />
            )}
            {installments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuotas registradas.</p>
            ) : (
              <InstallmentTable
                installments={installments}
                canEdit={canEdit}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {installments.length === 0 ? (
              financials && (
                <FinancingForm financials={financials} onGenerate={onGenerateSchedule} />
              )
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground space-x-3">
                    <span>
                      Plazo: <strong className="text-foreground">{financials?.financing_term_months} meses</strong>
                    </span>
                    {financials?.interest_rate_annual != null && (
                      <span>
                        Tasa:{" "}
                        <strong className="text-foreground">
                          {financials.interest_rate_annual === 0
                            ? "MSI"
                            : `${(financials.interest_rate_annual * 100).toFixed(2)}% anual`}
                        </strong>
                      </span>
                    )}
                    {financials?.down_payment && financials.down_payment > 0 && (
                      <span>
                        Enganche:{" "}
                        <strong className="text-foreground">{formatCurrency(financials.down_payment)}</strong>
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingAll}
                      onClick={handleDeleteAll}
                    >
                      <RotateCcw className="size-4" />
                      {deletingAll ? "Eliminando..." : "Regenerar"}
                    </Button>
                  )}
                </div>
                <InstallmentTable
                  installments={installments}
                  canEdit={canEdit}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
