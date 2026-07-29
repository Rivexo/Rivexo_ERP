import { z } from "zod";

export const milestoneExhibitionSchema = z.object({
  label: z.string().min(1, "La etiqueta es requerida"),
  percentage: z.coerce.number().positive("El % debe ser mayor a 0").max(100),
  due_date: z.string().min(1, "La fecha es requerida"),
});

export const milestonePlanSchema = z
  .object({
    exhibitions: z.array(milestoneExhibitionSchema).min(1, "Agrega al menos una exhibición"),
  })
  .refine(
    (val) => {
      const sum = val.exhibitions.reduce((s, e) => s + e.percentage, 0);
      return Math.abs(sum - 100) < 0.01;
    },
    { message: "Los porcentajes deben sumar 100%", path: ["exhibitions"] },
  );

export type MilestoneExhibition = z.infer<typeof milestoneExhibitionSchema>;
export type MilestonePlanFormValues = z.input<typeof milestonePlanSchema>;
export type MilestonePlanInput = z.output<typeof milestonePlanSchema>;
