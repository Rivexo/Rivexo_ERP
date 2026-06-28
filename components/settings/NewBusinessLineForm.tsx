"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBusinessLineAction } from "@/app/(dashboard)/settings/business-lines/actions";

export function NewBusinessLineForm() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          await createBusinessLineAction(name.trim());
          setName("");
        });
      }}
    >
      <Input
        placeholder="Nueva línea de negocio"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-64"
      />
      <Button type="submit" disabled={isPending}>
        Agregar
      </Button>
    </form>
  );
}
