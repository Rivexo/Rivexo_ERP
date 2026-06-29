import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const decisionSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional().or(z.literal("")),
  decided_at: z.preprocess(emptyToNull, z.string().nullable().optional()),
  impact: z.enum(["low", "medium", "high"]),
});

export type DecisionFormValues = z.input<typeof decisionSchema>;
export type DecisionInput = z.output<typeof decisionSchema>;
