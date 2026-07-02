import { z } from "zod";

// Number/date inputs left blank by the user submit as "" — normalize to null
// before validation so optional numeric/date columns don't get an empty string.
const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const dealSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  account_id: z.string().uuid("Selecciona una cuenta"),
  primary_contact_id: z.string().uuid().optional().nullable(),
  business_line_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  stage_id: z.string().uuid("Selecciona una etapa"),
  probability: z.preprocess(emptyToNull, z.coerce.number().int().min(0).max(100).nullable().optional()),
  expected_close_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  iva_rate: z.coerce.number().min(0).max(1),
  payment_method: z.enum(["transferencia", "tarjeta", "efectivo", "cheque", "otro"]).optional().nullable(),
  deposit_percentage: z.preprocess(emptyToNull, z.coerce.number().min(0).max(100).nullable().optional()),
  monthly_support_amount: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
  observations: z.string().optional().or(z.literal("")),
  // Solo se persiste si quien envía el formulario tiene permiso (founder/socio/finanzas); RLS lo garantiza también server-side.
  estimated_direct_cost: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
  is_financed: z.boolean(),
  financed_total: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
  financing_term_months: z.preprocess(emptyToNull, z.coerce.number().int().min(1).nullable().optional()),
  interest_rate: z.preprocess(emptyToNull, z.coerce.number().min(0).max(1).nullable().optional()),
  is_msi: z.boolean().optional().default(false),
}).refine((data) => !data.is_financed || (data.financed_total != null && data.financing_term_months != null), {
  message: "Captura el total financiado y el plazo en meses",
  path: ["financed_total"],
});

// Schema para la modalidad de pago al cerrar un deal como Closed Won
const contadoInstallmentSchema = z.object({
  label: z.string().min(1),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  amount: z.coerce.number().min(0),
});

export const wonPaymentSchema = z.discriminatedUnion("modalidad", [
  z.object({
    modalidad: z.literal("contado"),
    payment_method: z.enum(["transferencia", "tarjeta", "efectivo", "cheque", "otro"]),
    installments: z.array(contadoInstallmentSchema).min(1, "Agrega al menos una cuota"),
  }),
  z.object({
    modalidad: z.literal("financiamiento"),
    is_msi: z.boolean(),
    interest_rate: z.preprocess(emptyToNull, z.coerce.number().min(0).max(100).nullable().optional()),
    financing_term_months: z.coerce.number().int().min(1),
    financed_total: z.coerce.number().min(0),
  }),
]);

export type WonPaymentInput = z.output<typeof wonPaymentSchema>;

// zod v4's z.coerce.number() input type is `unknown`, so the form (pre-parse) and the
// action/service layer (post-parse) need distinct types — DealFormValues vs DealInput.
export type DealFormValues = z.input<typeof dealSchema>;
export type DealInput = z.output<typeof dealSchema>;
