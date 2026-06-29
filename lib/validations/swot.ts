import { z } from "zod";

export const swotSchema = z.object({
  type: z.enum(["strength", "weakness", "opportunity", "threat"]),
  description: z.string().min(1, "La descripción es requerida"),
});

export type SwotFormValues = z.input<typeof swotSchema>;
export type SwotInput = z.output<typeof swotSchema>;
