import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const freelancerInvoiceSchema = z.object({
  project_id: z.string().uuid("Selecciona un proyecto"),
  freelancer_name: z.string().min(1, "El nombre del freelancer es requerido"),
  amount: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  invoice_date: z.string().min(1, "La fecha es requerida"),
  status: z.enum(["pending", "paid"]),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type FreelancerInvoiceFormValues = z.input<typeof freelancerInvoiceSchema>;
export type FreelancerInvoiceInput = z.output<typeof freelancerInvoiceSchema>;
