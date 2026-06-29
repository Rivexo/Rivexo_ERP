import { notFound } from "next/navigation";
import { IdeasPhaseCard } from "@/components/projects/IdeasPhaseCard";
import { canManageProjects } from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";
import { listProjectIdeasPhases } from "@/services/ideas.service";
import { updateIdeasPhaseAction } from "./actions";

export default async function ProjectIdeasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, phases, members] = await Promise.all([
    getCurrentProfile(),
    listProjectIdeasPhases(id),
    listProfiles(),
  ]);

  const canEdit = profile ? canManageProjects(profile.role) : false;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {phases.map((phase) => (
        <IdeasPhaseCard
          key={phase.id}
          phase={phase}
          members={members}
          canEdit={canEdit}
          onSubmit={updateIdeasPhaseAction.bind(null, id, phase.id)}
        />
      ))}
    </div>
  );
}
