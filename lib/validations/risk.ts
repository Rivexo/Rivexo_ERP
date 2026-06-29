import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const riskSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  impact: z.enum(["low", "medium", "high"]),
  probability: z.enum(["low", "medium", "high"]),
  mitigation: z.string().optional().or(z.literal("")),
  owner_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  status: z.enum(["open", "mitigated", "closed"]),
});

export type RiskFormValues = z.input<typeof riskSchema>;
export type RiskInput = z.output<typeof riskSchema>;
