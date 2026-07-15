import { notFound, redirect } from "next/navigation";
import { PaymentPlanPanel } from "@/components/projects/PaymentPlanPanel";
import { CostSchedulePanel } from "@/components/projects/CostSchedulePanel";
import { CustomerInvoiceList } from "@/components/erp/CustomerInvoiceList";
import { CustomerPaymentList } from "@/components/erp/CustomerPaymentList";
import { formatCurrency } from "@/lib/utils";
import {
  canManageCrm,
  canManageProjectFinancials,
  canViewProjectFinancials,
} from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject, getProjectFinancials } from "@/services/projects.service";
import { listFreelancerInvoicesByProject } from "@/services/freelancer-invoices.service";
import { listInvoicesByProject } from "@/services/customer-invoices.service";
import { listPaymentsByProject, listPendingInvoicesForProject } from "@/services/customer-payments.service";
import { listInstallmentsByDeal } from "@/services/installments.service";
import { listCostInstallmentsByProject } from "@/services/project-cost-schedule.service";
import {
  setPaymentTypeAction,
  createProjectInstallmentAction,
  updateProjectInstallmentAction,
  deleteProjectInstallmentAction,
  deleteAllInstallmentsAction,
  generateProjectScheduleAction,
  linkInstallmentToInvoiceAction,
} from "../../payment-actions";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceStatusAction,
  uploadInvoiceFilesAction,
} from "../../invoice-actions";
import {
  createPaymentAction,
  applyPaymentAction,
  removeApplicationAction,
  deletePaymentAction,
  uploadPaymentComplementAction,
} from "../../payment-receipt-actions";
import {
  setCostPaymentTypeAction,
  createCostInstallmentAction,
  updateCostInstallmentAction,
  deleteCostInstallmentAction,
  generateCostScheduleAction,
  deleteAllCostInstallmentsAction,
  linkFreelancerInvoiceAction,
} from "../../cost-schedule-actions";

export default async function ProjectFinancesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canViewProjectFinancials(profile.role)) redirect("/");

  const project = await getProject(id);
  if (!project) notFound();

  const financials = await getProjectFinancials(id);

  const [freelancerInvoices, customerInvoices, installments, customerPayments, pendingInvoices, costInstallments] =
    await Promise.all([
      listFreelancerInvoicesByProject(id),
      listInvoicesByProject(id),
      listInstallmentsByDeal(project.deal_id),
      listPaymentsByProject(id),
      listPendingInvoicesForProject(id),
      listCostInstallmentsByProject(id),
    ]);

  const manageFinancials = canManageProjectFinancials(profile.role);
  const canManageSchedule = canManageCrm(profile.role);

  const directCost = financials?.direct_cost ?? 0;
  const budgetSold = financials?.budget_sold ?? 0;
  const margin = budgetSold - directCost;

  return (
    <div className="space-y-6">
      {/* Resumen financiero read-only */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Presupuesto</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(budgetSold)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Costo directo</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(directCost)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Margen bruto</p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(margin)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Margen %</p>
          <p className="text-sm font-semibold tabular-nums">
            {budgetSold > 0 ? `${((margin / budgetSold) * 100).toFixed(1)}%` : "—"}
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
      />

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
    </div>
  );
}
