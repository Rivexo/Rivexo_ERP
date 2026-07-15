import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const projectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  business_line_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  project_manager_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  start_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]),
  progress_pct: z.coerce.number().min(0).max(100),
  // Solo se persiste si quien envía el formulario tiene permiso (founder/socio/finanzas); RLS lo garantiza también server-side.
  budget_sold: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
});

export type ProjectFormValues = z.input<typeof projectSchema>;
export type ProjectInput = z.output<typeof projectSchema>;
