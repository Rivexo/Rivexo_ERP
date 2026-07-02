import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueList } from "@/components/erp/RevenueList";
import { RevenueForecast } from "@/components/erp/RevenueForecast";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listRevenues, listAllInstallmentsWithProject, getRevenueForecast } from "@/services/revenues.service";
import { listProjects } from "@/services/projects.service";
import { createRevenueAction, deleteRevenueAction, updateRevenueAction } from "./actions";

export default async function ErpRevenuesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [revenues, projects, installments, forecast] = await Promise.all([
    listRevenues(),
    listProjects(),
    listAllInstallmentsWithProject(),
    getRevenueForecast(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Ingresos"
          description="Forecast de cobranza comprometida (Closed Won) y cobros registrados"
        />
      </div>

      {/* Forecast — cuotas pendientes de deals ganados */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Forecast de cobranza
        </h2>
        <RevenueForecast forecast={forecast} />
      </section>

      <div className="border-t pt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cobros registrados
        </h2>
        <RevenueList
          revenues={revenues}
          projects={projects}
          installments={installments}
          onCreate={createRevenueAction}
          onUpdate={updateRevenueAction}
          onDelete={deleteRevenueAction}
        />
      </div>
    </div>
  );
}
