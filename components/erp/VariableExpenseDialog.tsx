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
  variableExpenseSchema,
  type VariableExpenseFormValues,
  type VariableExpenseInput,
} from "@/lib/validations/variable-expense";
import type { VariableExpenseWithRelations } from "@/services/variable-expenses.service";
import type { ExpenseCategory } from "@/services/expense-categories.service";
import type { ProjectWithRelations } from "@/services/projects.service";

export function VariableExpenseDialog({
  expense,
  categories,
  projects,
  trigger,
  onSubmit,
}: {
  expense?: VariableExpenseWithRelations;
  categories: ExpenseCategory[];
  projects: ProjectWithRelations[];
  trigger: React.ReactNode;
  onSubmit: (input: VariableExpenseInput) => Promise<void>;
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
  } = useForm<VariableExpenseFormValues, unknown, VariableExpenseInput>({
    resolver: zodResolver(variableExpenseSchema),
    defaultValues: {
      project_id: expense?.project_id ?? null,
      category_id: expense?.category_id ?? null,
      description: expense?.description ?? "",
      amount: expense?.amount ?? 0,
      expense_date: expense?.expense_date ?? new Date().toISOString().slice(0, 10),
    },
  });

  async function submit(values: VariableExpenseInput) {
    await onSubmit(values);
    if (!expense) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Editar gasto variable" : "Nuevo gasto variable"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input id="description" {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="expense_date">Fecha *</Label>
              <Input id="expense_date" type="date" {...register("expense_date")} />
              {errors.expense_date && <p className="text-sm text-destructive">{errors.expense_date.message}</p>}
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
