import { notFound, redirect } from "next/navigation";
import { PaymentPlanPanel } from "@/components/projects/PaymentPlanPanel";
import { CostSchedulePanel } from "@/components/projects/CostSchedulePanel";
import { CustomerInvoiceList } from "@/components/erp/CustomerInvoiceList";
import { CollectionVsCostTimeline } from "@/components/erp/CollectionVsCostTimeline";
import { EditableBudget } from "@/components/erp/EditableBudget";
import { formatCurrency } from "@/lib/utils";
import { canAccessErp, canManageProjectFinancials, canManageCrm } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject, getProjectFinancials } from "@/services/projects.service";
import { getProjectCashflowComparison } from "@/services/erp-projects.service";
import { listFreelancerInvoicesByProject } from "@/services/freelancer-invoices.service";
import { listInvoicesByProject } from "@/services/customer-invoices.service";
import { listInstallmentsByDeal } from "@/services/installments.service";
import { listCostInstallmentsByProject } from "@/services/project-cost-schedule.service";
import {
  setPaymentTypeAction,
  createProjectInstallmentAction,
  updateProjectInstallmentAction,
  deleteProjectInstallmentAction,
  deleteAllInstallmentsAction,
  generateProjectScheduleAction,
  generateMilestoneScheduleAction,
  uploadInstallmentInvoiceAction,
  uploadInstallmentComplementAction,
  updateInstallmentStatusAction,
  linkInstallmentToInvoiceAction,
  updateProjectBudgetAction,
} from "../payment-actions";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceStatusAction,
  uploadInvoiceFilesAction,
} from "../invoice-actions";
import {
  setCostPaymentTypeAction,
  createCostInstallmentAction,
  updateCostInstallmentAction,
  updateCostInstallmentStatusAction,
  deleteCostInstallmentAction,
  generateCostScheduleAction,
  deleteAllCostInstallmentsAction,
  linkFreelancerInvoiceAction,
} from "../cost-schedule-actions";

export default async function ErpProjectFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const project = await getProject(id);
  if (!project) notFound();

  const financials = await getProjectFinancials(id);

  const [freelancerInvoices, customerInvoices, installments, costInstallments, cashflow] = await Promise.all([
    listFreelancerInvoicesByProject(id),
    listInvoicesByProject(id),
    listInstallmentsByDeal(project.deal_id),
    listCostInstallmentsByProject(id),
    getProjectCashflowComparison(id),
  ]);

  const manageFinancials = canManageProjectFinancials(profile.role);
  const canManageSchedule = canManageCrm(profile.role);

  const budgetSold = financials?.budget_sold ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  const collected = installments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pending = installments.filter((i) => i.status !== "paid");
  const receivable = pending.reduce((s, i) => s + i.amount, 0);
  const overdue = pending
    .filter((i) => !!i.due_date && i.due_date < today)
    .reduce((s, i) => s + i.amount, 0);

  const costTotal = costInstallments.reduce((s, i) => s + i.amount, 0);
  const costPaid = costInstallments.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const costPending = costInstallments.filter((i) => i.status !== "paid");
  const costPayable = costPending.reduce((s, i) => s + i.amount, 0);
  const costOverdue = costPending
    .filter((i) => !!i.due_date && i.due_date < today)
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.account?.name}</p>
      </div>

      {/* Resumen financiero read-only (sin costo directo/margen: eso vive en CRM) */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Presupuesto</p>
          <EditableBudget
            projectId={id}
            budgetSold={budgetSold}
            canEdit={manageFinancials}
            onSave={updateProjectBudgetAction}
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cobrado</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(collected)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Por cobrar</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(receivable)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vencido</p>
          <p className={"text-sm font-semibold tabular-nums" + (overdue > 0 ? " text-destructive" : "")}>
            {formatCurrency(overdue)}
          </p>
        </div>
      </div>

      <PaymentPlanPanel
        financials={financials}
        installments={installments}
        customerInvoices={customerInvoices}
        projectId={id}
        dealId={project.deal_id}
        canEdit={canManageSchedule}
        onSetPaymentType={setPaymentTypeAction.bind(null, id)}
        onCreate={createProjectInstallmentAction.bind(null, id, project.deal_id)}
        onUpdate={updateProjectInstallmentAction.bind(null, id)}
        onDelete={deleteProjectInstallmentAction.bind(null, id)}
        onDeleteAll={deleteAllInstallmentsAction.bind(null, id, project.deal_id)}
        onGenerateSchedule={generateProjectScheduleAction.bind(null, id, project.deal_id)}
        onLinkInvoice={linkInstallmentToInvoiceAction.bind(null, id)}
        onGenerateMilestones={generateMilestoneScheduleAction.bind(null, id, project.deal_id)}
        onUploadInvoice={uploadInstallmentInvoiceAction.bind(null, id)}
        onUploadComplement={uploadInstallmentComplementAction.bind(null, id)}
        onUpdateStatus={updateInstallmentStatusAction.bind(null, id)}
      />

      {/* Resumen de pago a proveedores: todo lo no pagado cuenta como "Por pagar" */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Costo total</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(costTotal)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pagado</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(costPaid)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Por pagar</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(costPayable)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vencido</p>
          <p className={"text-sm font-semibold tabular-nums" + (costOverdue > 0 ? " text-destructive" : "")}>
            {formatCurrency(costOverdue)}
          </p>
        </div>
      </div>

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
        onUpdateStatus={updateCostInstallmentStatusAction.bind(null, id)}
      />

      <CollectionVsCostTimeline rows={cashflow} />

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
    </div>
  );
}
