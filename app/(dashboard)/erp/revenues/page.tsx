import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueList } from "@/components/erp/RevenueList";
import { RevenueForecast } from "@/components/erp/RevenueForecast";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listRevenues, listAllInstallmentsWithProject, getRevenueForecast, getExpenseForecast } from "@/services/revenues.service";
import { listProjects } from "@/services/projects.service";
import { createRevenueAction, deleteRevenueAction, updateRevenueAction } from "./actions";

export default async function ErpRevenuesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [revenues, projects, installments, forecast, expenseForecast] = await Promise.all([
    listRevenues(),
    listProjects(),
    listAllInstallmentsWithProject(),
    getRevenueForecast(),
    getExpenseForecast(),
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

      {expenseForecast.length > 0 && (
        <section className="border-t pt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Egresos proyectados
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 text-left font-medium">Proyecto</th>
                  <th className="py-2 text-left font-medium">Concepto</th>
                  <th className="py-2 text-right font-medium">Monto</th>
                  <th className="py-2 text-left font-medium">Vencimiento</th>
                  <th className="py-2 text-left font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {expenseForecast.map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="border-b">
                    <td className="py-2 text-muted-foreground">{row.project_name}</td>
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(row.amount)}
                    </td>
                    <td className="py-2">
                      {row.due_date
                        ? new Date(`${row.due_date}T00:00:00`).toLocaleDateString("es-MX")
                        : "—"}
                      {row.is_overdue && (
                        <span className="ml-1 text-xs text-destructive font-semibold">Vencida</span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground capitalize">
                      {row.source === "cost_installment" ? "Plan de costo" : "Factura freelancer"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
