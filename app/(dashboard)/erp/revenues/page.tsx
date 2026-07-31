import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueList } from "@/components/erp/RevenueList";
import { RevenueForecast } from "@/components/erp/RevenueForecast";
import { MonthlyForecastChart } from "@/components/erp/MonthlyForecastChart";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import {
  listRevenues,
  listAllInstallmentsWithProject,
  getRevenueForecast,
  getExpenseForecast,
  getIncomeTimeline,
} from "@/services/revenues.service";
import type { ForecastRow, ForecastSummary } from "@/services/revenues.service";
import { listProjects } from "@/services/projects.service";
import { createRevenueAction, deleteRevenueAction, updateRevenueAction } from "./actions";

function buildSummary(rows: ForecastRow[]): ForecastSummary {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonthStart = today.slice(0, 7) + "-01";
  const nextMonthStart = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return d.toISOString().slice(0, 10); })();
  return {
    total_committed: rows.reduce((s, r) => s + r.amount, 0),
    due_this_month: rows.filter((r) => r.due_date && r.due_date >= thisMonthStart && r.due_date < nextMonthStart).reduce((s, r) => s + r.amount, 0),
    overdue: rows.filter((r) => r.is_overdue).reduce((s, r) => s + r.amount, 0),
    rows,
  };
}

export default async function ErpRevenuesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [revenues, projects, installments, forecast, expenseForecast, timeline] = await Promise.all([
    listRevenues(),
    listProjects(),
    listAllInstallmentsWithProject(),
    getRevenueForecast(),
    getExpenseForecast(),
    getIncomeTimeline(11),
  ]);

  const projectForecast = buildSummary(forecast.rows.filter((r) => r.source === "project"));
  const supportForecast = buildSummary(forecast.rows.filter((r) => r.source === "support"));

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Ingresos"
          description="Forecast de cobranza comprometida (Closed Won) y cobros registrados"
        />
      </div>

      <MonthlyForecastChart
        title="Forecast de ingresos — próximos meses"
        description="Deployment (proyectos) vs. soporte, incluyendo meses de soporte aún no facturados (proyectado)"
        rows={timeline.map((row) => ({
          month: row.month,
          primary: row.deployment_amount,
          secondary: row.support_amount,
          is_projected: row.is_projected,
        }))}
        primaryLabel="Deployment"
        secondaryLabel="Soporte"
        primaryColor="#3b82f6"
        secondaryColor="#a855f7"
      />

      {/* Forecast — Deployment */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Forecast — Proyectos (Deployment)
        </h2>
        <RevenueForecast forecast={projectForecast} />
      </section>

      {/* Forecast — Soporte MRR (solo cuando hay proyectos en etapa S) */}
      {supportForecast.rows.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Soporte MRR
          </h2>
          <RevenueForecast forecast={supportForecast} />
        </section>
      )}

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
