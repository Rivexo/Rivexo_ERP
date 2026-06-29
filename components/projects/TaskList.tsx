"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDialog } from "@/components/projects/TaskDialog";
import type { TaskInput } from "@/lib/validations/task";
import { buildTaskTree, type Task, type TaskNode, type TaskWithRelations } from "@/lib/task-tree";
import type { ProjectIdeasPhaseWithRelations } from "@/services/ideas.service";
import type { Profile } from "@/services/profiles.service";

const STATUS_OPTIONS = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "in_review", label: "En revisión" },
  { value: "done", label: "Hecho" },
  { value: "blocked", label: "Bloqueado" },
] as const;

const PRIORITY_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "secondary",
  urgent: "destructive",
};

export function TaskList({
  tasks,
  phases,
  members,
  canEdit,
  onCreate,
  onUpdate,
  onUpdateStatus,
  onDelete,
}: {
  tasks: TaskWithRelations[];
  phases: ProjectIdeasPhaseWithRelations[];
  members: Profile[];
  canEdit: boolean;
  onCreate: (input: TaskInput) => Promise<void>;
  onUpdate: (id: string, input: TaskInput) => Promise<void>;
  onUpdateStatus: (id: string, status: Task["status"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const roots = buildTaskTree(tasks);

  const groups = phases.map((phase) => ({
    phase,
    roots: roots.filter((t) => t.ideas_phase_instance_id === phase.id),
  }));
  const noPhase = roots.filter((t) => !t.ideas_phase_instance_id);

  async function handleStatusChange(id: string, status: Task["status"]) {
    await onUpdateStatus(id, status);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <TaskDialog
          phases={phases}
          members={members}
          tasks={tasks}
          onSubmit={onCreate}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Nueva tarea
            </Button>
          }
        />
      )}

      {[...groups, { phase: null, roots: noPhase }].map(({ phase, roots: phaseRoots }) =>
        phaseRoots.length === 0 ? null : (
          <div key={phase?.id ?? "none"} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {phase ? `${phase.phase.code} · ${phase.phase.name}` : "Sin fase"}
            </h3>
            <div className="space-y-1">
              {phaseRoots.map((node) => (
                <TaskRow
                  key={node.id}
                  node={node}
                  depth={0}
                  phases={phases}
                  members={members}
                  tasks={tasks}
                  canEdit={canEdit}
                  onUpdate={onUpdate}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ),
      )}

      {roots.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay tareas.</p>}
    </div>
  );
}

function TaskRow({
  node,
  depth,
  phases,
  members,
  tasks,
  canEdit,
  onUpdate,
  onStatusChange,
  onDelete,
}: {
  node: TaskNode;
  depth: number;
  phases: ProjectIdeasPhaseWithRelations[];
  members: Profile[];
  tasks: TaskWithRelations[];
  canEdit: boolean;
  onUpdate: (id: string, input: TaskInput) => Promise<void>;
  onStatusChange: (id: string, status: Task["status"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
        style={{ marginLeft: depth * 24 }}
      >
        <Select value={node.status} onValueChange={(v) => onStatusChange(node.id, v as Task["status"])} disabled={!canEdit}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Status">
              {(value: string | null) => STATUS_OPTIONS.find((o) => o.value === value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex-1 truncate text-sm font-medium">{node.title}</span>

        <Badge variant={PRIORITY_VARIANT[node.priority]}>{node.priority}</Badge>

        {node.assignee && <span className="text-xs text-muted-foreground">{node.assignee.full_name}</span>}
        {node.due_date && <span className="text-xs text-muted-foreground">{node.due_date}</span>}

        {canEdit && (
          <div className="flex items-center gap-1">
            <TaskDialog
              task={node}
              phases={phases}
              members={members}
              tasks={tasks}
              onSubmit={(input) => onUpdate(node.id, input)}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Editar tarea">
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <Button variant="ghost" size="icon" aria-label="Eliminar tarea" onClick={() => onDelete(node.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {node.children.map((child) => (
        <TaskRow
          key={child.id}
          node={child}
          depth={depth + 1}
          phases={phases}
          members={members}
          tasks={tasks}
          canEdit={canEdit}
          onUpdate={onUpdate}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
