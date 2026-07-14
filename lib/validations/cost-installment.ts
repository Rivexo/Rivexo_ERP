import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const costInstallmentSchema = z.object({
  label: z.string().min(1, "La etiqueta es requerida"),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type CostInstallmentFormValues = z.input<typeof costInstallmentSchema>;
export type CostInstallmentInput = z.output<typeof costInstallmentSchema>;
