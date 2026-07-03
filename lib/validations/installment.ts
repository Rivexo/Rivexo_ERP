import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const installmentSchema = z.object({
  label: z.string().min(1, "La etiqueta es requerida"),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  status: z.enum(["pending", "invoiced", "partially_paid", "paid"]),
});

export type InstallmentFormValues = z.input<typeof installmentSchema>;
export type InstallmentInput = z.output<typeof installmentSchema>;
