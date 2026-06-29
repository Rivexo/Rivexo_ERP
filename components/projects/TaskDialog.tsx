"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { taskSchema, type TaskFormValues, type TaskInput } from "@/lib/validations/task";
import type { Profile } from "@/services/profiles.service";
import type { ProjectIdeasPhaseWithRelations } from "@/services/ideas.service";
import type { TaskWithRelations } from "@/lib/task-tree";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
] as const;

const STATUS_OPTIONS = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "in_review", label: "En revisión" },
  { value: "done", label: "Hecho" },
  { value: "blocked", label: "Bloqueado" },
] as const;

export function TaskDialog({
  task,
  phases,
  members,
  tasks,
  trigger,
  onSubmit,
}: {
  task?: TaskWithRelations;
  phases: ProjectIdeasPhaseWithRelations[];
  members: Profile[];
  tasks: TaskWithRelations[];
  trigger: React.ReactNode;
  onSubmit: (input: TaskInput) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues, unknown, TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      ideas_phase_instance_id: task?.ideas_phase_instance_id ?? null,
      parent_task_id: task?.parent_task_id ?? null,
      assignee_id: task?.assignee_id ?? null,
      priority: task?.priority ?? "medium",
      status: task?.status ?? "todo",
      estimated_hours: task?.estimated_hours ?? null,
      actual_hours: task?.actual_hours ?? null,
      start_date: task?.start_date ?? "",
      due_date: task?.due_date ?? "",
    },
  });

  const parentOptions = tasks.filter((t) => t.id !== task?.id);

  async function submit(values: TaskInput) {
    setServerError(null);
    try {
      await onSubmit(values);
      if (!task) reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fase IDEAS</Label>
              <Select
                value={watch("ideas_phase_instance_id") ?? undefined}
                onValueChange={(value) => setValue("ideas_phase_instance_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin fase">
                    {(value: string | null) => phases.find((p) => p.id === value)?.phase.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.phase.code} · {p.phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tarea padre</Label>
              <Select
                value={watch("parent_task_id") ?? undefined}
                onValueChange={(value) => setValue("parent_task_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna (tarea raíz)">
                    {(value: string | null) => parentOptions.find((t) => t.id === value)?.title}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {parentOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select
                value={watch("assignee_id") ?? undefined}
                onValueChange={(value) => setValue("assignee_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar">
                    {(value: string | null) => members.find((m) => m.id === value)?.full_name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as TaskInput["priority"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad">
                    {(value: string | null) => PRIORITY_OPTIONS.find((o) => o.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value as TaskInput["status"])}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas estimadas</Label>
              <Input id="estimated_hours" type="number" step="0.5" min={0} {...register("estimated_hours")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_hours">Horas reales</Label>
              <Input id="actual_hours" type="number" step="0.5" min={0} {...register("actual_hours")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de inicio</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha límite</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
