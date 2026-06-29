import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewExpenseCategoryForm } from "@/components/settings/NewExpenseCategoryForm";
import { ToggleActiveButton } from "@/components/settings/ToggleActiveButton";
import { canManageSettings } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listExpenseCategories } from "@/services/expense-categories.service";
import { toggleExpenseCategoryActiveAction } from "./actions";

const KIND_LABELS: Record<string, string> = { fixed: "Fijo", variable: "Variable" };

export default async function ExpenseCategoriesSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageSettings(profile.role)) redirect("/");

  const categories = await listExpenseCategories();

  return (
    <div className="space-y-6">
      <PageHeader title="Categorías de Gasto" description="Nómina, Software, Renta, Internet, Contabilidad, Marketing, etc." />
      <NewExpenseCategoryForm />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{KIND_LABELS[category.kind]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={category.is_active ? "secondary" : "outline"}>
                  {category.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </TableCell>
              <TableCell>
                <ToggleActiveButton
                  isActive={category.is_active}
                  onToggle={toggleExpenseCategoryActiveAction.bind(null, category.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
