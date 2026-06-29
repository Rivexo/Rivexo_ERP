"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { revenueSchema, type RevenueFormValues, type RevenueInput } from "@/lib/validations/revenue";
import type { RevenueWithRelations, InstallmentWithProject } from "@/services/revenues.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const PAYMENT_METHOD_OPTIONS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
] as const;

export function RevenueDialog({
  revenue,
  projects,
  installments,
  trigger,
  onSubmit,
}: {
  revenue?: RevenueWithRelations;
  projects: ProjectWithRelations[];
  installments: InstallmentWithProject[];
  trigger: React.ReactNode;
  onSubmit: (input: RevenueInput) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevenueFormValues, unknown, RevenueInput>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      project_id: revenue?.project_id ?? null,
      amount: revenue?.amount ?? 0,
      received_at: revenue?.received_at ?? new Date().toISOString().slice(0, 10),
      payment_method: revenue?.payment_method ?? "",
      related_installment_id: revenue?.related_installment_id ?? null,
      notes: revenue?.notes ?? "",
    },
  });

  const selectedProjectId = watch("project_id");
  const projectInstallments = installments.filter((i) => i.project_id === selectedProjectId);

  async function submit(values: RevenueInput) {
    await onSubmit(values);
    if (!revenue) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{revenue ? "Editar ingreso" : "Nuevo ingreso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select
                value={watch("project_id") ?? undefined}
                onValueChange={(v) => {
                  setValue("project_id", v);
                  setValue("related_installment_id", null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto">
                    {(value: string | null) => projects.find((p) => p.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cuota relacionada</Label>
              <Select
                value={watch("related_installment_id") ?? undefined}
                onValueChange={(v) => setValue("related_installment_id", v)}
                disabled={projectInstallments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin cuota">
                    {(value: string | null) => projectInstallments.find((i) => i.id === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projectInstallments.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_at">Fecha *</Label>
              <Input id="received_at" type="date" {...register("received_at")} />
              {errors.received_at && <p className="text-sm text-destructive">{errors.received_at.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Forma de pago</Label>
              <Select
                value={watch("payment_method") ?? undefined}
                onValueChange={(v) => setValue("payment_method", v ?? undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una forma de pago">
                    {(value: string | null) => PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
