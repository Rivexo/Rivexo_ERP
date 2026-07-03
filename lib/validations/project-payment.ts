import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const financingConfigSchema = z.object({
  financing_term_months: z.coerce.number().int().min(1, "El plazo es requerido"),
  interest_rate_annual_pct: z.coerce.number().min(0, "La tasa no puede ser negativa").max(100),
  credit_start_date: z.preprocess(emptyToNull, z.string().nullable()),
  down_payment: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
});

export type FinancingConfigFormValues = z.input<typeof financingConfigSchema>;
export type FinancingConfigInput = z.output<typeof financingConfigSchema>;
