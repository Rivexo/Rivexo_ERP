"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { decisionSchema, type DecisionFormValues, type DecisionInput } from "@/lib/validations/decision";
import type { ProjectDecisionWithRelations } from "@/services/decisions.service";

const IMPACT_LABELS: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };
const IMPACT_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export function DecisionLog({
  decisions,
  canEdit,
  onCreate,
  onDelete,
}: {
  decisions: ProjectDecisionWithRelations[];
  canEdit: boolean;
  onCreate: (input: DecisionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && <NewDecisionDialog onCreate={onCreate} />}

      {decisions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin decisiones registradas.</p>
      ) : (
        <div className="space-y-3">
          {decisions.map((decision) => (
            <Card key={decision.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{decision.title}</p>
                    <Badge variant={IMPACT_VARIANT[decision.impact]}>{IMPACT_LABELS[decision.impact]}</Badge>
                  </div>
                  {decision.description && <p className="text-sm text-muted-foreground">{decision.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {decision.decided_at} · {decision.decided_by_profile?.full_name ?? "—"}
                  </p>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="icon" aria-label="Eliminar decisión" onClick={() => handleDelete(decision.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewDecisionDialog({ onCreate }: { onCreate: (input: DecisionInput) => Promise<void> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DecisionFormValues, unknown, DecisionInput>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { title: "", description: "", decided_at: "", impact: "medium" },
  });

  async function submit(values: DecisionInput) {
    await onCreate(values);
    reset({ title: "", description: "", decided_at: "", impact: "medium" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" /> Nueva decisión
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva decisión</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decided_at">Fecha</Label>
              <Input id="decided_at" type="date" {...register("decided_at")} />
            </div>
            <div className="space-y-2">
              <Label>Impacto</Label>
              <Select value={watch("impact")} onValueChange={(v) => setValue("impact", v as DecisionInput["impact"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Impacto">{(value: string | null) => (value ? IMPACT_LABELS[value] : null)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
