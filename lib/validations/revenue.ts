import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const revenueSchema = z.object({
  project_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  received_at: z.string().min(1, "La fecha es requerida"),
  payment_method: z.string().optional().or(z.literal("")),
  related_installment_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  notes: z.string().optional().or(z.literal("")),
});

export type RevenueFormValues = z.input<typeof revenueSchema>;
export type RevenueInput = z.output<typeof revenueSchema>;
