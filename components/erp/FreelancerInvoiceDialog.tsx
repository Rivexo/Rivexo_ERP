"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ProjectWithRelations } from "@/services/projects.service";

export function FreelancerInvoiceDialog({
  fixedProjectId,
  projects,
  trigger,
  onCreate,
}: {
  fixedProjectId?: string;
  projects: ProjectWithRelations[];
  trigger: React.ReactNode;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(fixedProjectId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(formRef.current!);
    formData.set("project_id", projectId);

    const file = formData.get("file");
    if (file instanceof File && file.size > 0 && file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF");
      return;
    }
    if (!projectId) {
      setError("Selecciona un proyecto");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
      formRef.current?.reset();
      setProjectId(fixedProjectId ?? "");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva factura de freelancer</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          {!fixedProjectId && (
            <div className="space-y-2">
              <Label>Proyecto *</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto">
                    {(value: string | null) => projects.find((p) => p.id === value)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="freelancer_name">Freelancer *</Label>
            <Input id="freelancer_name" name="freelancer_name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Fecha *</Label>
              <Input id="invoice_date" name="invoice_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Factura (PDF)</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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
