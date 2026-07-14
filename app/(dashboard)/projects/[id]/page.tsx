import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectFinancialsPanel } from "@/components/projects/ProjectFinancialsPanel";
import { PaymentPlanPanel } from "@/components/projects/PaymentPlanPanel";
import { CommentsPanel } from "@/components/shared/CommentsPanel";
import { LinksPanel } from "@/components/shared/LinksPanel";
import { FreelancerInvoiceList } from "@/components/erp/FreelancerInvoiceList";
import { CustomerInvoiceList } from "@/components/erp/CustomerInvoiceList";
import { CustomerPaymentList } from "@/components/erp/CustomerPaymentList";
import { CostSchedulePanel } from "@/components/projects/CostSchedulePanel";
import {
  isAdminRole,
  canAccessErp,
  canManageCrm,
  canManageProjectFinancials,
  canViewProjectFinancials,
} from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { getProject, getProjectFinancials } from "@/services/projects.service";
import { listComments } from "@/services/comments.service";
import { listLinks } from "@/services/links.service";
import { listFreelancerInvoicesByProject } from "@/services/freelancer-invoices.service";
import { listInvoicesByProject } from "@/services/customer-invoices.service";
import { listPaymentsByProject, listPendingInvoicesForProject } from "@/services/customer-payments.service";
import { listFilesByEntityIds } from "@/services/files.service";
import { listInstallmentsByDeal } from "@/services/installments.service";
import { createCommentAction, createLinkAction, deleteCommentAction, deleteLinkAction, updateProjectAction } from "../actions";
import {
  createFreelancerInvoiceAction,
  deleteFreelancerInvoiceAction,
  toggleFreelancerInvoiceStatusAction,
} from "../../erp/freelancers/actions";
import {
  setPaymentTypeAction,
  createProjectInstallmentAction,
  updateProjectInstallmentAction,
  deleteProjectInstallmentAction,
  deleteAllInstallmentsAction,
  generateProjectScheduleAction,
} from "../payment-actions";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceStatusAction,
  uploadInvoiceFilesAction,
} from "../invoice-actions";
import {
  createPaymentAction,
  applyPaymentAction,
  removeApplicationAction,
  deletePaymentAction,
  uploadPaymentComplementAction,
} from "../payment-receipt-actions";
import {
  setCostPaymentTypeAction,
  createCostInstallmentAction,
  updateCostInstallmentAction,
  deleteCostInstallmentAction,
  generateCostScheduleAction,
  deleteAllCostInstallmentsAction,
  linkFreelancerInvoiceAction,
} from "../cost-schedule-actions";
import { listCostInstallmentsByProject } from "@/services/project-cost-schedule.service";
import { linkInstallmentToInvoiceAction } from "../payment-actions";

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
  const canManagePaymentSchedule = profile ? canManageCrm(profile.role) : false;
  const projectManagers = profiles.filter((p) => p.role === "project_manager" || isAdminRole(p.role));

  const [freelancerInvoices, customerInvoices, installments, customerPayments, pendingInvoices, costInstallments] =
    await Promise.all([
      showFreelancerInvoices ? listFreelancerInvoicesByProject(id) : Promise.resolve([]),
      showFinancials ? listInvoicesByProject(id) : Promise.resolve([]),
      showFinancials ? listInstallmentsByDeal(project.deal_id) : Promise.resolve([]),
      showFinancials ? listPaymentsByProject(id) : Promise.resolve([]),
      showFinancials ? listPendingInvoicesForProject(id) : Promise.resolve([]),
      showFinancials ? listCostInstallmentsByProject(id) : Promise.resolve([]),
    ]);
  const freelancerFiles = showFreelancerInvoices
    ? await listFilesByEntityIds("freelancer_invoice", freelancerInvoices.map((i) => i.id))
    : {};

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

      {showFinancials && (
        <PaymentPlanPanel
          financials={financials}
          installments={installments}
          customerInvoices={customerInvoices}
          projectId={id}
          dealId={project.deal_id}
          canEdit={canManagePaymentSchedule}
          onSetPaymentType={setPaymentTypeAction.bind(null, id)}
          onCreate={createProjectInstallmentAction.bind(null, id, project.deal_id)}
          onUpdate={updateProjectInstallmentAction.bind(null, id)}
          onDelete={deleteProjectInstallmentAction.bind(null, id)}
          onDeleteAll={deleteAllInstallmentsAction.bind(null, id, project.deal_id)}
          onGenerateSchedule={generateProjectScheduleAction.bind(null, id, project.deal_id)}
          onLinkInvoice={linkInstallmentToInvoiceAction.bind(null, id)}
        />
      )}

      {showFinancials && (
        <CostSchedulePanel
          financials={financials}
          costInstallments={costInstallments}
          freelancerInvoices={freelancerInvoices}
          canEdit={manageFinancials}
          onSetCostPaymentType={setCostPaymentTypeAction.bind(null, id)}
          onCreate={createCostInstallmentAction.bind(null, id, project.deal_id)}
          onUpdate={updateCostInstallmentAction.bind(null, id)}
          onDelete={deleteCostInstallmentAction.bind(null, id)}
          onDeleteAll={deleteAllCostInstallmentsAction.bind(null, id)}
          onGenerateSchedule={generateCostScheduleAction.bind(null, id, project.deal_id)}
          onLinkFreelancerInvoice={linkFreelancerInvoiceAction.bind(null, id)}
        />
      )}

      {showFinancials && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Facturas al cliente</h3>
          <CustomerInvoiceList
            invoices={customerInvoices}
            canEdit={manageFinancials}
            onCreate={manageFinancials ? createInvoiceAction.bind(null, id) : undefined}
            onUpload={uploadInvoiceFilesAction.bind(null, id)}
            onStatusChange={updateInvoiceStatusAction.bind(null, id)}
            onDelete={deleteInvoiceAction.bind(null, id)}
          />
        </div>
      )}

      {showFinancials && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Pagos recibidos</h3>
          <CustomerPaymentList
            payments={customerPayments}
            pendingInvoices={pendingInvoices}
            projectId={id}
            canEdit={manageFinancials}
            onCreate={createPaymentAction.bind(null, id)}
            onApply={applyPaymentAction.bind(null, id)}
            onRemoveApplication={removeApplicationAction.bind(null, id)}
            onDelete={deletePaymentAction.bind(null, id)}
            onUploadComplement={uploadPaymentComplementAction}
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
