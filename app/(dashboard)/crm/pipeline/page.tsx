import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { listDeals } from "@/services/deals.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";

export default async function PipelinePage() {
  const [stages, deals] = await Promise.all([listPipelineStages(), listDeals()]);

  return (
    <div>
      <PageHeader title="Pipeline" description="Arrastra los deals entre etapas" />
      <PipelineBoard stages={stages} deals={deals} />
    </div>
  );
}
