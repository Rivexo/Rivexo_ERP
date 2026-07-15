import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectTabNav } from "@/components/projects/ProjectTabNav";
import { canViewProjects, canViewProjectFinancials } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planeación",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canViewProjects(profile.role)) redirect("/");

  const project = await getProject(id);
  if (!project) notFound();

  const showFinances = !!profile && canViewProjectFinancials(profile.role);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <Badge variant="outline">{STATUS_LABELS[project.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.account?.name}</p>
      </div>

      <ProjectTabNav projectId={id} showFinances={showFinances} />

      <div className="pt-2">{children}</div>
    </div>
  );
}
