"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectSchema, type ProjectFormValues, type ProjectInput } from "@/lib/validations/project";
import type { Profile } from "@/services/profiles.service";
import type { BusinessLine } from "@/services/business-lines.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const STATUS_OPTIONS = [
  { value: "planning", label: "Planeación" },
  { value: "active", label: "Activo" },
  { value: "on_hold", label: "En pausa" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export function ProjectForm({
  project,
  businessLines,
  projectManagers,
  onSubmit,
}: {
  project: ProjectWithRelations;
  businessLines: BusinessLine[];
  projectManagers: Profile[];
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues, unknown, ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      business_line_id: project.business_line_id ?? null,
      project_manager_id: project.project_manager_id ?? null,
      start_date: project.start_date ?? "",
      due_date: project.due_date ?? "",
      status: project.status,
      progress_pct: project.progress_pct,
    },
  });

  async function submit(values: ProjectInput) {
    setServerError(null);
    try {
      await onSubmit(values);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Línea de negocio</Label>
          <Select
            value={watch("business_line_id") ?? undefined}
            onValueChange={(value) => setValue("business_line_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una línea">
                {(value: string | null) => businessLines.find((line) => line.id === value)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businessLines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Project Manager</Label>
          <Select
            value={watch("project_manager_id") ?? undefined}
            onValueChange={(value) => setValue("project_manager_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar">
                {(value: string | null) => projectManagers.find((pm) => pm.id === value)?.full_name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projectManagers.map((pm) => (
                <SelectItem key={pm.id} value={pm.id}>
                  {pm.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Estatus</Label>
          <Select value={watch("status")} onValueChange={(value) => setValue("status", value as ProjectInput["status"])}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estatus">
                {(value: string | null) => STATUS_OPTIONS.find((opt) => opt.value === value)?.label}
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
          <Label htmlFor="progress_pct">Progreso (%)</Label>
          <Input id="progress_pct" type="number" min={0} max={100} {...register("progress_pct")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">Fecha de inicio</Label>
          <Input id="start_date" type="date" {...register("start_date")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Fecha de entrega</Label>
          <Input id="due_date" type="date" {...register("due_date")} />
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
