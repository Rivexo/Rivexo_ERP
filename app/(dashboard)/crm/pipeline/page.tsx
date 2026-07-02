import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { canViewFinancials } from "@/lib/permissions";
import { listDeals, getPipelineSummary } from "@/services/deals.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";
import { getCurrentProfile } from "@/services/profiles.service";
import { formatCurrency } from "@/lib/utils";

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 px-4 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default async function PipelinePage() {
  const [stages, deals, summary, profile] = await Promise.all([
    listPipelineStages(),
    listDeals(),
    getPipelineSummary(),
    getCurrentProfile(),
  ]);

  const showMargin = profile ? canViewFinancials(profile.role) : false;

  return (
    <div>
      <PageHeader title="Pipeline" description="Arrastra los deals entre etapas" />

      <div className="mb-4 flex flex-wrap gap-4">
        <KpiTile label="TCV Real (Closed Won)" value={formatCurrency(summary.tcv_real ?? 0)} />
        <KpiTile label="TCV Potencial" value={formatCurrency(summary.tcv_potencial ?? 0)} />
        {showMargin && (
          <>
            <KpiTile label="Margen Real (Closed Won)" value={formatCurrency(summary.margin_real ?? 0)} />
            <KpiTile label="Margen Potencial" value={formatCurrency(summary.margin_potencial ?? 0)} />
          </>
        )}
      </div>

      <PipelineBoard stages={stages} deals={deals} />
    </div>
  );
}
