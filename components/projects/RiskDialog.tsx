"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { riskSchema, type RiskFormValues, type RiskInput } from "@/lib/validations/risk";
import type { ProjectRiskWithRelations } from "@/services/risks.service";
import type { Profile } from "@/services/profiles.service";

const LEVEL_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
] as const;

const STATUS_OPTIONS = [
  { value: "open", label: "Abierto" },
  { value: "mitigated", label: "Mitigado" },
  { value: "closed", label: "Cerrado" },
] as const;

export function RiskDialog({
  risk,
  members,
  trigger,
  onSubmit,
}: {
  risk?: ProjectRiskWithRelations;
  members: Profile[];
  trigger: React.ReactNode;
  onSubmit: (input: RiskInput) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RiskFormValues, unknown, RiskInput>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      description: risk?.description ?? "",
      impact: risk?.impact ?? "medium",
      probability: risk?.probability ?? "medium",
      mitigation: risk?.mitigation ?? "",
      owner_id: risk?.owner_id ?? null,
      status: risk?.status ?? "open",
    },
  });

  async function submit(values: RiskInput) {
    await onSubmit(values);
    if (!risk) reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{risk ? "Editar riesgo" : "Nuevo riesgo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea id="description" rows={2} {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select value={watch("impact")} onValueChange={(v) => setValue("impact", v as RiskInput["impact"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Impacto">
                    {(value: string | null) => LEVEL_OPTIONS.find((o) => o.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Probabilidad</Label>
              <Select
                value={watch("probability")}
                onValueChange={(v) => setValue("probability", v as RiskInput["probability"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Probabilidad">
                    {(value: string | null) => LEVEL_OPTIONS.find((o) => o.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={watch("owner_id") ?? undefined} onValueChange={(v) => setValue("owner_id", v)}>
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
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as RiskInput["status"])}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="mitigation">Mitigación</Label>
            <Textarea id="mitigation" rows={2} {...register("mitigation")} />
          </div>

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
