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
import {
  supportSubscriptionSchema,
  type SupportSubscriptionFormValues,
  type SupportSubscriptionInput,
} from "@/lib/validations/support-subscription";
import type { SupportSubscriptionWithRelations } from "@/services/support-subscriptions.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const STATUS_OPTIONS = [
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "cancelled", label: "Cancelada" },
] as const;

export function SupportSubscriptionDialog({
  subscription,
  accounts,
  projects,
  trigger,
  onSubmit,
}: {
  subscription?: SupportSubscriptionWithRelations;
  accounts: { id: string; name: string }[];
  projects: ProjectWithRelations[];
  trigger: React.ReactNode;
  onSubmit: (input: SupportSubscriptionInput) => Promise<void>;
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
  } = useForm<SupportSubscriptionFormValues, unknown, SupportSubscriptionInput>({
    resolver: zodResolver(supportSubscriptionSchema),
    defaultValues: {
      account_id: subscription?.account_id ?? "",
      project_id: subscription?.project_id ?? null,
      amount: subscription?.amount ?? 0,
      billing_day: subscription?.billing_day ?? 1,
      status: subscription?.status ?? "active",
      start_date: subscription?.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: subscription?.end_date ?? null,
    },
  });

  async function submit(values: SupportSubscriptionInput) {
    await onSubmit(values);
    if (!subscription) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subscription ? "Editar suscripción de soporte" : "Nueva suscripción de soporte"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cuenta *</Label>
              <Select value={watch("account_id")} onValueChange={(v) => setValue("account_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta">
                    {(value: string | null) => accounts.find((a) => a.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Proyecto</Label>
              <Select value={watch("project_id") ?? undefined} onValueChange={(v) => setValue("project_id", v)}>
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
              <Label htmlFor="amount">Monto mensual *</Label>
              <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_day">Día de cobro *</Label>
              <Input id="billing_day" type="number" min={1} max={31} {...register("billing_day")} />
              {errors.billing_day && <p className="text-sm text-destructive">{errors.billing_day.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Estatus</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as SupportSubscriptionInput["status"])}>
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

            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de inicio *</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de fin</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
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
