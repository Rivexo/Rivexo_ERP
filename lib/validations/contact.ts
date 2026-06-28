import { z } from "zod";

export const contactSchema = z.object({
  account_id: z.string().uuid(),
  full_name: z.string().min(1, "El nombre es requerido"),
  job_title: z.string().optional().or(z.literal("")),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().optional().or(z.literal("")),
  preferences: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  is_primary: z.boolean(),
});

export type ContactInput = z.infer<typeof contactSchema>;
