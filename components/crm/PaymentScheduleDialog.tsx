"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { installmentSchema, type InstallmentFormValues, type InstallmentInput } from "@/lib/validations/installment";
import type { Installment } from "@/services/installments.service";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "invoiced", label: "Facturada" },
  { value: "paid", label: "Pagada" },
] as const;

export function PaymentScheduleDialog({
  installment,
  trigger,
  onSubmit,
}: {
  installment?: Installment;
  trigger: React.ReactNode;
  onSubmit: (input: InstallmentInput) => Promise<void>;
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
  } = useForm<InstallmentFormValues, unknown, InstallmentInput>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      label: installment?.label ?? "",
      due_date: installment?.due_date ?? null,
      amount: installment?.amount ?? 0,
      status: installment?.status ?? "pending",
    },
  });

  async function submit(values: InstallmentInput) {
    await onSubmit(values);
    if (!installment) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{installment ? "Editar cuota" : "Nueva cuota"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Etiqueta *</Label>
            <Input id="label" placeholder="Anticipo 50%" {...register("label")} />
            {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de vencimiento</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estatus</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as InstallmentInput["status"])}>
              <SelectTrigger>
                <SelectValue placeholder="Estatus">
                  {(value: string | null) => STATUS_OPTIONS.find((o) => o.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
