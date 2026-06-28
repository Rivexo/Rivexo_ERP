import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  legal_name: z.string().optional().or(z.literal("")),
  tax_id: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  company_size: z.enum(["micro", "small", "medium", "large"]).optional().nullable(),
  address: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  lead_source: z.string().optional().or(z.literal("")),
  status: z.enum(["lead", "prospect", "customer", "inactive"]),
  owner_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().or(z.literal("")),
});

export type AccountInput = z.infer<typeof accountSchema>;
