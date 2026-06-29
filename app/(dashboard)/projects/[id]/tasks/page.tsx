import { notFound } from "next/navigation";
import { TaskList } from "@/components/projects/TaskList";
import { canManageProjects } from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";
import { listProjectIdeasPhases } from "@/services/ideas.service";
import { listProjectTasks } from "@/services/tasks.service";
import { createTaskAction, deleteTaskAction, updateTaskAction, updateTaskStatusAction } from "./actions";

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, phases, tasks, members] = await Promise.all([
    getCurrentProfile(),
    listProjectIdeasPhases(id),
    listProjectTasks(id),
    listProfiles(),
  ]);

  const canEdit = profile ? canManageProjects(profile.role) : false;

  return (
    <TaskList
      tasks={tasks}
      phases={phases}
      members={members}
      canEdit={canEdit}
      onCreate={createTaskAction.bind(null, id)}
      onUpdate={updateTaskAction.bind(null, id)}
      onUpdateStatus={updateTaskStatusAction.bind(null, id)}
      onDelete={deleteTaskAction.bind(null, id)}
    />
  );
}
