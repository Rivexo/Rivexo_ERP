"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPipelineStageAction } from "@/app/(dashboard)/settings/pipeline-stages/actions";

export function NewPipelineStageForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          await createPipelineStageAction(name.trim());
          setName("");
        });
      }}
    >
      <Input placeholder="Nueva etapa" value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
      <Button type="submit" disabled={isPending}>
        Agregar
      </Button>
    </form>
  );
}
