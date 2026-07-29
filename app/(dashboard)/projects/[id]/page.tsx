import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { PaymentReminderWidget } from "@/components/projects/PaymentReminderWidget";
import { CommentsPanel } from "@/components/shared/CommentsPanel";
import { LinksPanel } from "@/components/shared/LinksPanel";
import { isAdminRole, canAccessErp, canViewProjectFinancials } from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { getProject } from "@/services/projects.service";
import { listComments } from "@/services/comments.service";
import { listLinks } from "@/services/links.service";
import { listPendingInstallmentsByProject } from "@/services/installments.service";
import { createCommentAction, createLinkAction, deleteCommentAction, deleteLinkAction, updateProjectAction } from "../actions";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, businessLines, profiles, comments, links] = await Promise.all([
    getCurrentProfile(),
    listBusinessLines(),
    listProfiles(),
    listComments("project", id),
    listLinks("project", id),
  ]);

  const showReminders = profile ? canViewProjectFinancials(profile.role) : false;
  const showErpLink = profile ? canAccessErp(profile.role) : false;
  const projectManagers = profiles.filter((p) => p.role === "project_manager" || isAdminRole(p.role));

  const pendingInstallments = showReminders ? await listPendingInstallmentsByProject(id) : [];

  return (
    <div className="space-y-6">
      {showReminders && pendingInstallments.length > 0 && (
        <PaymentReminderWidget
          installments={pendingInstallments}
          projectId={id}
          canAccessErp={showErpLink}
        />
      )}

      <ProjectForm
        project={project}
        businessLines={businessLines}
        projectManagers={projectManagers}
        onSubmit={updateProjectAction.bind(null, id)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {profile && (
          <CommentsPanel
            entityType="project"
            entityId={id}
            comments={comments}
            currentUserId={profile.id}
            onCreate={createCommentAction}
            onDelete={deleteCommentAction}
          />
        )}
        <LinksPanel entityType="project" entityId={id} links={links} onCreate={createLinkAction} onDelete={deleteLinkAction} />
      </div>
    </div>
  );
}
