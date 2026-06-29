import { notFound } from "next/navigation";
import { RiskList } from "@/components/projects/RiskList";
import { canManageProjects } from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";
import { listProjectRisks } from "@/services/risks.service";
import { createRiskAction, deleteRiskAction, updateRiskAction } from "./actions";

export default async function ProjectRisksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, risks, members] = await Promise.all([getCurrentProfile(), listProjectRisks(id), listProfiles()]);
  const canEdit = profile ? canManageProjects(profile.role) : false;

  return (
    <RiskList
      risks={risks}
      members={members}
      canEdit={canEdit}
      onCreate={createRiskAction.bind(null, id)}
      onUpdate={updateRiskAction.bind(null, id)}
      onDelete={deleteRiskAction.bind(null, id)}
    />
  );
}
