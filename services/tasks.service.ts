import { createClient } from "@/lib/supabase/server";
import type { TaskInput } from "@/lib/validations/task";

export type { Task, TaskNode, TaskWithRelations } from "@/lib/task-tree";
export { buildTaskTree } from "@/lib/task-tree";
import type { Task, TaskWithRelations } from "@/lib/task-tree";

const TASK_RELATIONS_SELECT = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(id, full_name),
  phase:project_ideas_phases(id, phase:ideas_phases(code, name))
`;

export async function listProjectTasks(projectId: string): Promise<TaskWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_RELATIONS_SELECT)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("position", { ascending: true });
  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}

export async function getTask(id: string): Promise<TaskWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select(TASK_RELATIONS_SELECT).eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as unknown as TaskWithRelations;
}

export async function createTask(projectId: string, input: TaskInput, createdBy: string): Promise<Task> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, project_id: projectId, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(input).eq("id", id);
  if (error) throw error;
}

export async function updateTaskStatus(id: string, status: Task["status"]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function softDeleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
