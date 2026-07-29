"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function EditableBudget({
  projectId,
  budgetSold,
  canEdit,
  onSave,
}: {
  projectId: string;
  budgetSold: number;
  canEdit: boolean;
  onSave: (projectId: string, budgetSold: number) => Promise<void>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budgetSold));
  const [isSaving, setIsSaving] = useState(false);

  if (!canEdit) {
    return <p className="text-sm font-semibold tabular-nums">{formatCurrency(budgetSold)}</p>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="group flex items-center gap-1.5 text-sm font-semibold tabular-nums"
        onClick={() => setEditing(true)}
      >
        {formatCurrency(budgetSold)}
        <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  async function save() {
    setIsSaving(true);
    try {
      await onSave(projectId, Number(value));
      setEditing(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-32 text-sm"
        autoFocus
      />
      <Button size="sm" className="h-7 px-2" disabled={isSaving} onClick={save}>
        {isSaving ? "..." : "Guardar"}
      </Button>
    </div>
  );
}
