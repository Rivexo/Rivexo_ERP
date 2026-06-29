import { z } from "zod";

const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional().or(z.literal("")),
  ideas_phase_instance_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  parent_task_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  assignee_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "in_review", "done", "blocked"]),
  estimated_hours: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
  actual_hours: z.preprocess(emptyToNull, z.coerce.number().min(0).nullable().optional()),
  start_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  due_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type TaskFormValues = z.input<typeof taskSchema>;
export type TaskInput = z.output<typeof taskSchema>;
