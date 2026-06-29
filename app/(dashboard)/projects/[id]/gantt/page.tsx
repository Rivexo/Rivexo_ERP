import { notFound } from "next/navigation";
import { GanttChart } from "@/components/projects/GanttChart";
import { getProject } from "@/services/projects.service";
import { listProjectTasks } from "@/services/tasks.service";

export default async function ProjectGanttPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const tasks = await listProjectTasks(id);

  return <GanttChart tasks={tasks} />;
}
