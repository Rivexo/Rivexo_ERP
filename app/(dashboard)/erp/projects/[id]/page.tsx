import { notFound, redirect } from "next/navigation";
import { PaymentPlanPanel } from "@/components/projects/PaymentPlanPanel";
import { CostSchedulePanel } from "@/components/projects/CostSchedulePanel";
import { CustomerInvoiceList } from "@/components/erp/CustomerInvoiceList";
import { CollectionVsCostTimeline } from "@/components/erp/CollectionVsCostTimeline";
import { formatCurrency } from "@/lib/utils";
import { calcIvaBreakdown } from "@/lib/iva";
import { canAccessErp, canManageProjectFinancials, canManageCrm } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { getProject, getProjectFinancials } from "@/services/projects.service";
import { getDealFinancials } from "@/services/deals.service";
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
  uploadCostInstallmentInvoiceAction,
} from "../cost-schedule-actions";

export default async function ErpProjectFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const project = await getProject(id);
  if (!project) notFound();

  const [financials, dealFinancials] = await Promise.all([
    getProjectFinancials(id),
    getDealFinancials(project.deal_id),
  ]);

  const [freelancerInvoices, customerInvoices, installments, costInstallments, cashflow] = await Promise.all([
    listFreelancerInvoicesByProject(id),
    listInvoicesByProject(id),
    listInstallmentsByDeal(project.deal_id),
    listCostInstallmentsByProject(id),
    getProjectCashflowComparison(id),
  ]);

  const manageFinancials = canManageProjectFinancials(profile.role);
  const canManageSchedule = canManageCrm(profile.role);

  // Fuente única: el deal del pipeline (deal_financials_view), no el snapshot
  // editable de project_financials — así el proyecto siempre refleja lo que
  // hay en el CRM. Fallback a project_financials solo para deals legacy sin
  // fila en deal_financials.
  const ivaRate = dealFinancials?.iva_rate ?? financials?.iva_rate ?? 0.16;
  const priceNet = dealFinancials?.price ?? financials?.budget_sold ?? 0;
  const priceWithIva = dealFinancials?.total_with_iva ?? calcIvaBreakdown(priceNet, ivaRate).total;
  const costNet = dealFinancials?.estimated_direct_cost ?? financials?.direct_cost ?? 0;
  const costWithIva = dealFinancials?.cost_with_iva ?? calcIvaBreakdown(costNet, ivaRate).total;

  const today = new Date().toISOString().slice(0, 10);

  // "Por cobrar"/"Por pagar" = total del deal (con IVA) menos lo ya cobrado/
  // pagado — no depende de que existan cuotas: un proyecto sin plan de pagos
  // generado todavía muestra el 100% pendiente, y cada cuota que se marca
  // pagada lo va descontando.
  const collected = installments
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);
  const receivable = Math.round((priceWithIva - collected) * 100) / 100;
  const overdue = installments
    .filter((i) => i.status !== "paid" && !!i.due_date && i.due_date < today)
    .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);

  const costPaid = costInstallments
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);
  const costPayable = Math.round((costWithIva - costPaid) * 100) / 100;
  const costOverdue = costInstallments
    .filter((i) => i.status !== "paid" && !!i.due_date && i.due_date < today)
    .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);

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
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(priceWithIva)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(priceNet)} sin IVA</p>
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
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(costWithIva)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(costNet)} sin IVA</p>
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
        onUploadInvoice={uploadCostInstallmentInvoiceAction.bind(null, id)}
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
