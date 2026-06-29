import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const fixedCostSchema = z.object({
  category_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  name: z.string().min(1, "El nombre es requerido"),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  frequency: z.enum(["monthly", "annual", "one_time"]),
  effective_date: z.string().min(1, "La fecha de inicio es requerida"),
  end_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  is_active: z.boolean(),
  notes: z.string().optional().or(z.literal("")),
});

export type FixedCostFormValues = z.input<typeof fixedCostSchema>;
export type FixedCostInput = z.output<typeof fixedCostSchema>;
