import { notFound } from "next/navigation";
import { TaskCalendar } from "@/components/projects/TaskCalendar";
import { getProject } from "@/services/projects.service";
import { listProjectTasks } from "@/services/tasks.service";

export default async function ProjectCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const tasks = await listProjectTasks(id);

  return <TaskCalendar tasks={tasks} />;
}
