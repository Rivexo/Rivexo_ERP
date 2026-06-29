"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ideasPhaseSchema, type IdeasPhaseFormValues, type IdeasPhaseInput } from "@/lib/validations/ideas-phase";
import type { ProjectIdeasPhaseWithRelations } from "@/services/ideas.service";
import type { Profile } from "@/services/profiles.service";

const STATUS_OPTIONS = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "in_review", label: "En revisión" },
  { value: "done", label: "Hecho" },
  { value: "blocked", label: "Bloqueado" },
] as const;

export function IdeasPhaseCard({
  phase,
  members,
  canEdit,
  onSubmit,
}: {
  phase: ProjectIdeasPhaseWithRelations;
  members: Profile[];
  canEdit: boolean;
  onSubmit: (input: IdeasPhaseInput) => Promise<void>;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<IdeasPhaseFormValues, unknown, IdeasPhaseInput>({
    resolver: zodResolver(ideasPhaseSchema),
    defaultValues: {
      objectives: phase.objectives ?? "",
      status: phase.status,
      owner_id: phase.owner_id ?? null,
      due_date: phase.due_date ?? "",
    },
  });

  async function submit(values: IdeasPhaseInput) {
    await onSubmit(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {phase.phase.code}
          </span>
          {phase.phase.name}
        </CardTitle>
        <Badge variant="outline">{STATUS_OPTIONS.find((o) => o.value === watch("status"))?.label}</Badge>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div className="space-y-2">
            <Label>Objetivos</Label>
            <Textarea rows={2} disabled={!canEdit} {...register("objectives")} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as IdeasPhaseInput["status"], { shouldDirty: true })}
                disabled={!canEdit}
              >
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
              <Label>Responsable</Label>
              <Select
                value={watch("owner_id") ?? undefined}
                onValueChange={(value) => setValue("owner_id", value, { shouldDirty: true })}
                disabled={!canEdit}
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
              <Label>Fecha límite</Label>
              <Input type="date" disabled={!canEdit} {...register("due_date")} />
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
              {saved && <span className="text-xs text-muted-foreground">Guardado</span>}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
