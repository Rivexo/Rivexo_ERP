import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { canViewProjects } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProjects } from "@/services/projects.service";

const STATUS_LABELS: Record<string, string> = {
  planning: "Planeación",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function ProjectsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canViewProjects(profile.role)) redirect("/");

  const projects = await listProjects();

  return (
    <div>
      <PageHeader title="Proyectos" description="Proyectos en ejecución, convertidos desde deals ganados" />

      {projects.length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos"
          description="Convierte un deal en la etapa Closed Won para crear el primero."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>PM</TableHead>
              <TableHead>Progreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>{project.account?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[project.status]}</Badge>
                </TableCell>
                <TableCell>{project.project_manager?.full_name ?? "—"}</TableCell>
                <TableCell>{project.progress_pct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
