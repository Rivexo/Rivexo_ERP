import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const ideasPhaseSchema = z.object({
  objectives: z.string().optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
  owner_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type IdeasPhaseFormValues = z.input<typeof ideasPhaseSchema>;
export type IdeasPhaseInput = z.output<typeof ideasPhaseSchema>;
