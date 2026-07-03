import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const customerPaymentSchema = z.object({
  paid_at: z.string().min(1, "La fecha de pago es requerida"),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  payment_method: z.preprocess(
    emptyToNull,
    z.enum(["transferencia", "tarjeta", "efectivo", "cheque", "otro"]).nullable().optional(),
  ),
  bank_reference: z.preprocess(emptyToNull, z.string().nullable().optional()),
  bank_account: z.preprocess(emptyToNull, z.string().nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type CustomerPaymentFormValues = z.input<typeof customerPaymentSchema>;
export type CustomerPaymentInput = z.output<typeof customerPaymentSchema>;
