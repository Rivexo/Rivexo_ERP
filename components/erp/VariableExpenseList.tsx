"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VariableExpenseDialog } from "@/components/erp/VariableExpenseDialog";
import { formatCurrency } from "@/lib/utils";
import type { VariableExpenseInput } from "@/lib/validations/variable-expense";
import type { VariableExpenseWithRelations } from "@/services/variable-expenses.service";
import type { ExpenseCategory } from "@/services/expense-categories.service";
import type { ProjectWithRelations } from "@/services/projects.service";

export function VariableExpenseList({
  expenses,
  categories,
  projects,
  onCreate,
  onUpdate,
  onDelete,
}: {
  expenses: VariableExpenseWithRelations[];
  categories: ExpenseCategory[];
  projects: ProjectWithRelations[];
  onCreate: (input: VariableExpenseInput) => Promise<void>;
  onUpdate: (id: string, input: VariableExpenseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{expense.project?.name ?? "—"}</TableCell>
                <TableCell>{expense.category?.name ?? "—"}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("es-MX")}</TableCell>
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
                    <Button variant="ghost" size="icon" aria-label="Eliminar gasto" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
