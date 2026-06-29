import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueList } from "@/components/erp/RevenueList";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listRevenues, listAllInstallmentsWithProject } from "@/services/revenues.service";
import { listProjects } from "@/services/projects.service";
import { createRevenueAction, deleteRevenueAction, updateRevenueAction } from "./actions";

export default async function ErpRevenuesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [revenues, projects, installments] = await Promise.all([
    listRevenues(),
    listProjects(),
    listAllInstallmentsWithProject(),
  ]);

  return (
    <div>
      <PageHeader title="Ingresos" description="Dinero realmente cobrado, separado del plan de pagos del deal" />
      <RevenueList
        revenues={revenues}
        projects={projects}
        installments={installments}
        onCreate={createRevenueAction}
        onUpdate={updateRevenueAction}
        onDelete={deleteRevenueAction}
      />
    </div>
  );
}
