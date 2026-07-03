import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const customerInvoiceSchema = z.object({
  folio: z.preprocess(emptyToNull, z.string().nullable().optional()),
  serie: z.preprocess(emptyToNull, z.string().nullable().optional()),
  uuid_fiscal: z.preprocess(emptyToNull, z.string().nullable().optional()),
  issued_at: z.string().min(1, "La fecha de emisión es requerida"),
  due_at: z.preprocess(emptyToNull, z.string().nullable().optional()),
  subtotal: z.coerce.number().min(0, "El subtotal debe ser ≥ 0"),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type CustomerInvoiceFormValues = z.input<typeof customerInvoiceSchema>;
export type CustomerInvoiceInput = z.output<typeof customerInvoiceSchema>;
