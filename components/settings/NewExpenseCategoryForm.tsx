"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createExpenseCategoryAction } from "@/app/(dashboard)/settings/expense-categories/actions";

const KIND_OPTIONS = [
  { value: "fixed", label: "Fijo" },
  { value: "variable", label: "Variable" },
] as const;

export function NewExpenseCategoryForm() {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"fixed" | "variable">("fixed");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          await createExpenseCategoryAction({ name: name.trim(), kind });
          setName("");
        });
      }}
    >
      <Input placeholder="Nueva categoría de gasto" value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
      <Select value={kind} onValueChange={(v) => setKind(v as "fixed" | "variable")}>
        <SelectTrigger className="w-32">
          <SelectValue>{(value: string | null) => KIND_OPTIONS.find((o) => o.value === value)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {KIND_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending}>
        Agregar
      </Button>
    </form>
  );
}
