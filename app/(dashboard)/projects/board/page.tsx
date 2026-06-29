import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { IdeasBoard } from "@/components/projects/IdeasBoard";
import { canViewProjects } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProjectsWithCurrentPhase } from "@/services/projects.service";

export default async function ProjectsBoardPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canViewProjects(profile.role)) redirect("/");

  const projects = await listProjectsWithCurrentPhase();

  return (
    <div>
      <PageHeader title="Tablero IDEAS" description="Proyectos agrupados por su fase actual de la metodología IDEAS" />

      {projects.length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos"
          description="Convierte un deal en la etapa Closed Won para crear el primero."
        />
      ) : (
        <IdeasBoard projects={projects} />
      )}
    </div>
  );
}
