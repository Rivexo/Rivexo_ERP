import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { canViewFinancials } from "@/lib/permissions";
import { listDeals, getPipelineSummary } from "@/services/deals.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";
import { getCurrentProfile } from "@/services/profiles.service";
import { formatCurrency } from "@/lib/utils";

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
        <div className="rounded-md border bg-muted/30 px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Facturación total</p>
          <p className="text-lg font-semibold">{formatCurrency(summary.total_billing)}</p>
        </div>
        {showMargin && (
          <div className="rounded-md border bg-muted/30 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Margen de contribución</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.total_contribution_margin)}</p>
          </div>
        )}
      </div>

      <PipelineBoard stages={stages} deals={deals} />
    </div>
  );
}
