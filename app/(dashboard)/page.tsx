import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DealsByStageChart } from "@/components/dashboard/DealsByStageChart";
import { PipelineDistributionChart } from "@/components/dashboard/PipelineDistributionChart";
import { WonLostTrendChart } from "@/components/dashboard/WonLostTrendChart";
import { formatCurrency } from "@/lib/utils";
import { getCrmDashboard, getDealsByStage, getDealsWonLostMonthly } from "@/services/dashboard.service";

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

export default async function DashboardPage() {
  const [kpis, dealsByStage, wonLostMonthly] = await Promise.all([
    getCrmDashboard(),
    getDealsByStage(),
    getDealsWonLostMonthly(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen comercial de Rivexo</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Cuentas activas" value={kpis.total_accounts ?? 0} />
        <KpiCard title="Deals abiertos" value={kpis.open_deals_count ?? 0} />
        <KpiCard title="Valor del pipeline" value={formatCurrency(kpis.pipeline_value)} />
        <KpiCard title="Deals ganados (mes)" value={kpis.deals_won_this_month ?? 0} />
        <KpiCard title="Ingresos ganados (mes)" value={formatCurrency(kpis.revenue_won_this_month)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DealsByStageChart data={dealsByStage} />
        <PipelineDistributionChart data={dealsByStage} />
      </div>

      <WonLostTrendChart data={wonLostMonthly} />
    </div>
  );
}
