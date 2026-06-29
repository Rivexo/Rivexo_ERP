import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  kind: z.enum(["fixed", "variable"]),
});

export type ExpenseCategoryFormValues = z.input<typeof expenseCategorySchema>;
export type ExpenseCategoryInput = z.output<typeof expenseCategorySchema>;
