import { notFound } from "next/navigation";
import { SwotBoard } from "@/components/projects/SwotBoard";
import { canManageProjects } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject } from "@/services/projects.service";
import { listProjectSwot } from "@/services/swot.service";
import { createSwotItemAction, deleteSwotItemAction } from "./actions";

export default async function ProjectSwotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, items] = await Promise.all([getCurrentProfile(), listProjectSwot(id)]);
  const canEdit = profile ? canManageProjects(profile.role) : false;

  return (
    <SwotBoard
      items={items}
      canEdit={canEdit}
      onCreate={createSwotItemAction.bind(null, id)}
      onDelete={deleteSwotItemAction.bind(null, id)}
    />
  );
}
