"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { swotSchema, type SwotInput } from "@/lib/validations/swot";
import type { ProjectSwot } from "@/services/swot.service";

const COLUMNS = [
  { type: "strength", label: "Fortalezas" },
  { type: "weakness", label: "Debilidades" },
  { type: "opportunity", label: "Oportunidades" },
  { type: "threat", label: "Amenazas" },
] as const;

export function SwotBoard({
  items,
  canEdit,
  onCreate,
  onDelete,
}: {
  items: ProjectSwot[];
  canEdit: boolean;
  onCreate: (input: SwotInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {COLUMNS.map((col) => (
        <Card key={col.type}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{col.label}</CardTitle>
            {canEdit && <NewSwotItemDialog type={col.type} onCreate={onCreate} />}
          </CardHeader>
          <CardContent className="space-y-2">
            {items
              .filter((i) => i.type === col.type)
              .map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm">
                  <span>{item.description}</span>
                  {canEdit && (
                    <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            {items.filter((i) => i.type === col.type).length === 0 && (
              <p className="text-sm text-muted-foreground">Sin elementos.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NewSwotItemDialog({
  type,
  onCreate,
}: {
  type: (typeof COLUMNS)[number]["type"];
  onCreate: (input: SwotInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SwotInput>({
    resolver: zodResolver(swotSchema),
    defaultValues: { type, description: "" },
  });

  async function submit(values: SwotInput) {
    await onCreate(values);
    reset({ type, description: "" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Agregar">
            <Plus className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo elemento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Textarea rows={3} placeholder="Describe el elemento..." {...register("description")} />
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
