"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { JournalEntryInput } from "@/lib/validations/journal-entry";
import type { ChartAccount } from "@/services/accounting.service";

type Line = { accountCode: string; debit: string; credit: string };

const EMPTY_LINE: Line = { accountCode: "", debit: "", credit: "" };

export function ManualJournalEntryDialog({
  accounts,
  trigger,
  onSubmit,
}: {
  accounts: ChartAccount[];
  trigger: React.ReactNode;
  onSubmit: (input: JournalEntryInput) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.01;

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setEntryDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isBalanced) {
      setError("Los cargos deben ser iguales a los abonos y mayores a 0");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        entry_date: entryDate,
        description,
        lines: lines
          .filter((l) => l.accountCode)
          .map((l) => ({ accountCode: l.accountCode, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
      reset();
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo asiento manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Fecha *</Label>
              <Input id="entry_date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
                <div className="space-y-1">
                  {index === 0 && <Label>Cuenta</Label>}
                  <Select value={line.accountCode} onValueChange={(v) => updateLine(index, { accountCode: v ?? "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cuenta">
                        {(value: string | null) => {
                          const account = accounts.find((a) => a.code === value);
                          return account ? `${account.code} ${account.name}` : null;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.code} value={a.code}>
                          {a.code} {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 space-y-1">
                  {index === 0 && <Label>Cargo</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.debit}
                    onChange={(e) => updateLine(index, { debit: e.target.value })}
                  />
                </div>
                <div className="w-28 space-y-1">
                  {index === 0 && <Label>Abono</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.credit}
                    onChange={(e) => updateLine(index, { credit: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar línea"
                  disabled={lines.length <= 2}
                  onClick={() => removeLine(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="size-4" /> Agregar línea
            </Button>
          </div>

          <p className={`text-sm ${isBalanced ? "text-muted-foreground" : "text-destructive"}`}>
            Cargos: {totalDebit.toFixed(2)} — Abonos: {totalCredit.toFixed(2)}
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !isBalanced}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
