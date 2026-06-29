import { notFound } from "next/navigation";
import { DecisionLog } from "@/components/projects/DecisionLog";
import { canManageProjects } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";
import { listProjectDecisions } from "@/services/decisions.service";
import { createDecisionAction, deleteDecisionAction } from "./actions";

export default async function ProjectDecisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, decisions] = await Promise.all([getCurrentProfile(), listProjectDecisions(id)]);
  const canEdit = profile ? canManageProjects(profile.role) : false;

  return (
    <DecisionLog
      decisions={decisions}
      canEdit={canEdit}
      onCreate={createDecisionAction.bind(null, id)}
      onDelete={deleteDecisionAction.bind(null, id)}
    />
  );
}
