"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema, type TaskInput } from "@/lib/validations/task";
import { createTask, softDeleteTask, updateTask, updateTaskStatus, type Task } from "@/services/tasks.service";
import { logActivity } from "@/services/activity.service";

export async function createTaskAction(projectId: string, input: TaskInput): Promise<void> {
  const parsed = taskSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const task = await createTask(projectId, parsed, user.id);
  await logActivity("project", projectId, "task_created", user.id, `Tarea creada: "${task.title}"`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/calendar`);
}

export async function updateTaskAction(projectId: string, id: string, input: TaskInput): Promise<void> {
  const parsed = taskSchema.parse(input);
  await updateTask(id, parsed);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/calendar`);
}

export async function updateTaskStatusAction(projectId: string, id: string, status: Task["status"]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await updateTaskStatus(id, status);
  if (user) {
    await logActivity("project", projectId, "task_status_changed", user.id, `Tarea movida a "${status}"`);
  }
  revalidatePath(`/projects/${projectId}/tasks`);
}

export async function deleteTaskAction(projectId: string, id: string): Promise<void> {
  await softDeleteTask(id);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/gantt`);
  revalidatePath(`/projects/${projectId}/calendar`);
}
