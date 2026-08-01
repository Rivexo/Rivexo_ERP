import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProjectsFinancialSummary } from "@/services/erp-projects.service";

export default async function ErpProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const projects = await listProjectsFinancialSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        description="Portal financiero por proyecto: plan de cobro, pago a proveedores, facturas y pagos"
      />

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin proyectos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Proyecto</th>
                <th className="px-4 py-2 text-left font-medium">Cuenta</th>
                <th className="px-4 py-2 text-left font-medium">Fase</th>
                <th className="px-4 py-2 text-right font-medium">Presupuesto (c/IVA)</th>
                <th className="px-4 py-2 text-right font-medium">Cobrado</th>
                <th className="px-4 py-2 text-right font-medium">Por cobrar</th>
                <th className="px-4 py-2 text-right font-medium">Vencido</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2">
                    <Link href={`/erp/projects/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{p.account_name}</td>
                  <td className="px-4 py-2">
                    {p.current_phase_code ? (
                      <Badge variant="outline">{p.current_phase_code} — {p.current_phase_name}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(p.budget_sold_with_iva)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(p.collected)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(p.receivable)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {p.overdue > 0 ? (
                      <span className="font-semibold text-destructive">{formatCurrency(p.overdue)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
