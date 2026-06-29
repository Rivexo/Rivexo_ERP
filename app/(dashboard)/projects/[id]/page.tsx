import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectFinancialsPanel } from "@/components/projects/ProjectFinancialsPanel";
import { CommentsPanel } from "@/components/shared/CommentsPanel";
import { LinksPanel } from "@/components/shared/LinksPanel";
import { FreelancerInvoiceList } from "@/components/erp/FreelancerInvoiceList";
import { PaymentScheduleList } from "@/components/crm/PaymentScheduleList";
import {
  isAdminRole,
  canAccessErp,
  canManageCrm,
  canManageProjectFinancials,
  canViewCrm,
  canViewProjectFinancials,
} from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { getProject, getProjectFinancials } from "@/services/projects.service";
import { listComments } from "@/services/comments.service";
import { listLinks } from "@/services/links.service";
import { listFreelancerInvoicesByProject } from "@/services/freelancer-invoices.service";
import { listFilesByEntityIds } from "@/services/files.service";
import { listInstallmentsByDeal } from "@/services/installments.service";
import { createCommentAction, createLinkAction, deleteCommentAction, deleteLinkAction, updateProjectAction } from "../actions";
import {
  createFreelancerInvoiceAction,
  deleteFreelancerInvoiceAction,
  toggleFreelancerInvoiceStatusAction,
} from "../../erp/freelancers/actions";
import {
  createInstallmentAction,
  deleteInstallmentAction,
  generateFinancingScheduleAction,
  updateInstallmentAction,
} from "../../crm/deals/actions";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [profile, businessLines, profiles, financials, comments, links] = await Promise.all([
    getCurrentProfile(),
    listBusinessLines(),
    listProfiles(),
    getProjectFinancials(id),
    listComments("project", id),
    listLinks("project", id),
  ]);

  const showFinancials = profile ? canViewProjectFinancials(profile.role) : false;
  const manageFinancials = profile ? canManageProjectFinancials(profile.role) : false;
  const showFreelancerInvoices = profile ? canAccessErp(profile.role) : false;
  const showPaymentSchedule = profile ? canViewCrm(profile.role) : false;
  const canManagePaymentSchedule = profile ? canManageCrm(profile.role) : false;
  const projectManagers = profiles.filter((p) => p.role === "project_manager" || isAdminRole(p.role));

  const freelancerInvoices = showFreelancerInvoices ? await listFreelancerInvoicesByProject(id) : [];
  const freelancerFiles = showFreelancerInvoices
    ? await listFilesByEntityIds("freelancer_invoice", freelancerInvoices.map((i) => i.id))
    : {};
  const installments = showPaymentSchedule ? await listInstallmentsByDeal(project.deal_id) : [];

  return (
    <div className="space-y-6">
      {showFinancials && <ProjectFinancialsPanel financials={financials} />}

      <ProjectForm
        project={project}
        financials={financials}
        businessLines={businessLines}
        projectManagers={projectManagers}
        canManageFinancials={manageFinancials}
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

      {showPaymentSchedule && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Plan de pagos</h3>
          <PaymentScheduleList
            installments={installments}
            canEdit={canManagePaymentSchedule}
            showGenerateSchedule={financials?.is_financed ?? false}
            onCreate={createInstallmentAction.bind(null, project.deal_id)}
            onUpdate={updateInstallmentAction.bind(null, project.deal_id)}
            onDelete={deleteInstallmentAction.bind(null, project.deal_id)}
            onGenerateSchedule={generateFinancingScheduleAction.bind(null, project.deal_id)}
          />
        </div>
      )}

      {showFreelancerInvoices && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Facturas de freelancers</h3>
          <FreelancerInvoiceList
            invoices={freelancerInvoices}
            files={freelancerFiles}
            fixedProjectId={id}
            projects={[]}
            onCreate={createFreelancerInvoiceAction}
            onToggleStatus={toggleFreelancerInvoiceStatusAction}
            onDelete={deleteFreelancerInvoiceAction}
          />
        </div>
      )}
    </div>
  );
}
