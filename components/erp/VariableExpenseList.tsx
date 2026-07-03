"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VariableExpenseDialog } from "@/components/erp/VariableExpenseDialog";
import { formatCurrency } from "@/lib/utils";
import type { VariableExpenseInput } from "@/lib/validations/variable-expense";
import type { VariableExpenseWithRelations } from "@/services/variable-expenses.service";
import type { ExpenseCategory } from "@/services/expense-categories.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const CONCILIATION_LABEL: Record<string, string> = {
  sin_comprobante: "Sin comprobante",
  con_comprobante: "Con comprobante",
  conciliado: "Conciliado",
};
const CONCILIATION_VARIANT: Record<string, "outline" | "secondary" | "destructive"> = {
  sin_comprobante: "outline",
  con_comprobante: "secondary",
  conciliado: "secondary",
};

function ConciliationUploadDialog({
  expenseId,
  trigger,
  onUpload,
}: {
  expenseId: string;
  trigger: React.ReactNode;
  onUpload: (id: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    setIsSubmitting(true);
    try {
      await onUpload(expenseId, formData);
      formRef.current?.reset();
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
          <DialogTitle>Subir comprobante fiscal</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-concil">PDF (factura)</Label>
            <Input id="pdf-concil" name="pdf" type="file" accept="application/pdf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xml-concil">XML (CFDI)</Label>
            <Input id="xml-concil" name="xml" type="file" accept=".xml,text/xml,application/xml" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VariableExpenseList({
  expenses,
  categories,
  projects,
  onCreate,
  onUpdate,
  onDelete,
  onUploadConciliation,
}: {
  expenses: VariableExpenseWithRelations[];
  categories: ExpenseCategory[];
  projects: ProjectWithRelations[];
  onCreate: (input: VariableExpenseInput) => Promise<void>;
  onUpdate: (id: string, input: VariableExpenseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadConciliation?: (id: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <VariableExpenseDialog
        categories={categories}
        projects={projects}
        onSubmit={onCreate}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Nuevo gasto variable
          </Button>
        }
      />

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin gastos variables registrados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const status = (expense.conciliation_status as string | undefined) ?? "sin_comprobante";
              return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.project?.name ?? "—"}</TableCell>
                  <TableCell>{expense.category?.name ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={CONCILIATION_VARIANT[status] ?? "outline"}>
                        {CONCILIATION_LABEL[status] ?? status}
                      </Badge>
                      {onUploadConciliation && status !== "conciliado" && (
                        <ConciliationUploadDialog
                          expenseId={expense.id}
                          onUpload={onUploadConciliation}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Subir comprobante">
                              <Upload className="size-3" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <VariableExpenseDialog
                        expense={expense}
                        categories={categories}
                        projects={projects}
                        onSubmit={(input) => onUpdate(expense.id, input)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar gasto">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar gasto"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
