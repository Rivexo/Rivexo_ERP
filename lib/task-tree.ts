import type { Database } from "@/types/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskWithRelations = Task & {
  assignee: { id: string; full_name: string } | null;
  phase: { id: string; phase: { code: string; name: string } } | null;
};

export type TaskNode = TaskWithRelations & { children: TaskNode[] };

// Builds a parent/child tree from a flat task list (tasks reference parent_task_id within the same project).
// Pure/client-safe: kept out of services/tasks.service.ts so client components don't pull in the server-only
// Supabase client when they only need this helper.
export function buildTaskTree(tasks: TaskWithRelations[]): TaskNode[] {
  const nodes = new Map<string, TaskNode>(tasks.map((t) => [t.id, { ...t, children: [] }]));
  const roots: TaskNode[] = [];

  for (const node of nodes.values()) {
    if (node.parent_task_id && nodes.has(node.parent_task_id)) {
      nodes.get(node.parent_task_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
