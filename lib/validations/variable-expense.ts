import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const variableExpenseSchema = z.object({
  project_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  category_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  description: z.string().min(1, "La descripción es requerida"),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  expense_date: z.string().min(1, "La fecha es requerida"),
});

export type VariableExpenseFormValues = z.input<typeof variableExpenseSchema>;
export type VariableExpenseInput = z.output<typeof variableExpenseSchema>;
