import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { RevenueCostTrendChart } from "@/components/erp/RevenueCostTrendChart";
import { canAccessErp } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getErpFinancialSummary, getErpMonthlyTrend } from "@/services/dashboard.service";

function KpiCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function ErpReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [summary, trend] = await Promise.all([getErpFinancialSummary(), getErpMonthlyTrend()]);

  const monthlyFixedCosts = summary.monthly_fixed_costs ?? 0;
  const currentMonthVariableExpenses = summary.current_month_variable_expenses ?? 0;
  const currentMonthRevenue = summary.current_month_revenue ?? 0;
  const currentMonthFinancingIncome = summary.current_month_financing_income ?? 0;
  const activeMrr = summary.active_mrr ?? 0;
  const activeArr = summary.active_arr ?? 0;
  const activeSupportMargin = summary.active_support_margin ?? 0;
  const currentMonthNet = currentMonthRevenue - currentMonthVariableExpenses - monthlyFixedCosts;

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Dashboard financiero de Rivexo" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Costos fijos mensuales" value={formatCurrency(monthlyFixedCosts)} />
        <KpiCard title="Gastos variables (mes)" value={formatCurrency(currentMonthVariableExpenses)} />
        <KpiCard title="Ingresos (mes)" value={formatCurrency(currentMonthRevenue)} />
        <KpiCard title="Ingresos por financiamiento (mes)" value={formatCurrency(currentMonthFinancingIncome)} />
        <KpiCard title="MRR activo" value={formatCurrency(activeMrr)} />
        <KpiCard title="ARR activo" value={formatCurrency(activeArr)} />
        <KpiCard title="Margen de soporte (mes)" value={formatCurrency(activeSupportMargin)} />
        <KpiCard title="Resultado neto (mes)" value={formatCurrency(currentMonthNet)} />
      </div>

      <RevenueCostTrendChart data={trend} />
    </div>
  );
}
