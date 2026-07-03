import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { FixedCostList } from "@/components/erp/FixedCostList";
import { VariableExpenseList } from "@/components/erp/VariableExpenseList";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listExpenseCategories } from "@/services/expense-categories.service";
import { listFixedCosts } from "@/services/fixed-costs.service";
import { listVariableExpenses } from "@/services/variable-expenses.service";
import { listProjects } from "@/services/projects.service";
import {
  createFixedCostAction,
  createVariableExpenseAction,
  deleteFixedCostAction,
  deleteVariableExpenseAction,
  updateFixedCostAction,
  updateVariableExpenseAction,
  uploadExpenseConciliationAction,
} from "./actions";

export default async function ErpCostsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [categories, fixedCosts, expenses, projects] = await Promise.all([
    listExpenseCategories(),
    listFixedCosts(),
    listVariableExpenses(),
    listProjects(),
  ]);

  const fixedCategories = categories.filter((c) => c.kind === "fixed");
  const variableCategories = categories.filter((c) => c.kind === "variable");

  return (
    <div>
      <PageHeader title="Costos" description="Costos fijos y gastos variables de la operación" />

      <Tabs defaultValue="fixed">
        <TabsList>
          <TabsTrigger value="fixed">Costos fijos ({fixedCosts.length})</TabsTrigger>
          <TabsTrigger value="variable">Gastos variables ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="mt-4">
          <FixedCostList
            fixedCosts={fixedCosts}
            categories={fixedCategories}
            onCreate={createFixedCostAction}
            onUpdate={updateFixedCostAction}
            onDelete={deleteFixedCostAction}
          />
        </TabsContent>

        <TabsContent value="variable" className="mt-4">
          <VariableExpenseList
            expenses={expenses}
            categories={variableCategories}
            projects={projects}
            onCreate={createVariableExpenseAction}
            onUpdate={updateVariableExpenseAction}
            onDelete={deleteVariableExpenseAction}
            onUploadConciliation={uploadExpenseConciliationAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
