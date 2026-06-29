"use client";

import { useState, useTransition } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConvertToProjectButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Rocket className="size-4" /> Convertir en proyecto
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir deal en proyecto</DialogTitle>
            <DialogDescription>
              Se creará un proyecto con las 5 fases de la metodología IDEAS, copiando cliente, línea de negocio,
              presupuesto y costo directo. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={() => startTransition(onConfirm)}>
              Convertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
