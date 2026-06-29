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
import { fixedCostSchema, type FixedCostFormValues, type FixedCostInput } from "@/lib/validations/fixed-cost";
import type { FixedCostWithRelations } from "@/services/fixed-costs.service";
import type { ExpenseCategory } from "@/services/expense-categories.service";

const FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "one_time", label: "Único" },
] as const;

export function FixedCostDialog({
  fixedCost,
  categories,
  trigger,
  onSubmit,
}: {
  fixedCost?: FixedCostWithRelations;
  categories: ExpenseCategory[];
  trigger: React.ReactNode;
  onSubmit: (input: FixedCostInput) => Promise<void>;
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
  } = useForm<FixedCostFormValues, unknown, FixedCostInput>({
    resolver: zodResolver(fixedCostSchema),
    defaultValues: {
      category_id: fixedCost?.category_id ?? null,
      name: fixedCost?.name ?? "",
      amount: fixedCost?.amount ?? 0,
      frequency: fixedCost?.frequency ?? "monthly",
      effective_date: fixedCost?.effective_date ?? new Date().toISOString().slice(0, 10),
      end_date: fixedCost?.end_date ?? null,
      is_active: fixedCost?.is_active ?? true,
      notes: fixedCost?.notes ?? "",
    },
  });

  async function submit(values: FixedCostInput) {
    await onSubmit(values);
    if (!fixedCost) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fixedCost ? "Editar costo fijo" : "Nuevo costo fijo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={watch("category_id") ?? undefined} onValueChange={(v) => setValue("category_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría">
                    {(value: string | null) => categories.find((c) => c.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
              <Label>Frecuencia</Label>
              <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v as FixedCostInput["frequency"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Frecuencia">
                    {(value: string | null) => FREQUENCY_OPTIONS.find((o) => o.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Fecha de inicio *</Label>
              <Input id="effective_date" type="date" {...register("effective_date")} />
              {errors.effective_date && <p className="text-sm text-destructive">{errors.effective_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de fin</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
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
