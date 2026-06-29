import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const supportSubscriptionSchema = z.object({
  account_id: z.string().uuid("Selecciona una cuenta"),
  project_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  billing_day: z.coerce.number().int().min(1).max(31),
  status: z.enum(["active", "paused", "cancelled"]),
  term: z.enum(["6_months", "1_year", "3_years", "indefinite"]),
  billing_cycle: z.enum(["monthly", "annual"]),
  payment_method: z.enum(["stripe", "transferencia"]),
  direct_cost: z.coerce.number().min(0, "El costo directo debe ser mayor o igual a 0"),
  start_date: z.string().min(1, "La fecha de inicio es requerida"),
  end_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type SupportSubscriptionFormValues = z.input<typeof supportSubscriptionSchema>;
export type SupportSubscriptionInput = z.output<typeof supportSubscriptionSchema>;
