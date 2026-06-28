import { redirect } from "next/navigation";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewPipelineStageForm } from "@/components/settings/NewPipelineStageForm";
import { PipelineStageRow } from "@/components/settings/PipelineStageRow";
import { canManageSettings } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";

export default async function PipelineStagesSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageSettings(profile.role)) redirect("/");

  const stages = await listPipelineStages();

  return (
    <div className="space-y-6">
      <PageHeader title="Etapas de Pipeline" description="Define el Kanban comercial" />
      <NewPipelineStageForm />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etapa</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage, index) => (
            <PipelineStageRow
              key={stage.id}
              stage={stage}
              isFirst={index === 0}
              isLast={index === stages.length - 1}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
