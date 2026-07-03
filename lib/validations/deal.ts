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
  observations: z.string().optional().or(z.literal("")),
  // Solo se persiste si quien envía el formulario tiene permiso (founder/socio/finanzas); RLS lo garantiza también server-side.
  estimated_direct_cost: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
});

// zod v4's z.coerce.number() input type is `unknown`, so the form (pre-parse) and the
// action/service layer (post-parse) need distinct types — DealFormValues vs DealInput.
export type DealFormValues = z.input<typeof dealSchema>;
export type DealInput = z.output<typeof dealSchema>;
