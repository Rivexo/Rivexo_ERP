"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { installmentSchema, type InstallmentInput } from "@/lib/validations/installment";
import { financingConfigSchema, type FinancingConfigInput } from "@/lib/validations/project-payment";
import { milestonePlanSchema, type MilestonePlanInput } from "@/lib/validations/milestone-plan";
import {
  createInstallmentForProject,
  updateInstallment,
  updateInstallmentStatus,
  uploadInstallmentComplement,
  deleteInstallment,
  deleteAllInstallmentsByDeal,
  generateProjectFinancingSchedule,
  generateMilestoneSchedule,
  linkInvoiceToInstallment,
} from "@/services/installments.service";
import { createInvoiceFromInstallment } from "@/services/customer-invoices.service";
import { updateProjectPaymentConfig, updateProjectBudget, getProject } from "@/services/projects.service";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/erp/projects/${projectId}`);
  revalidatePath("/erp/projects");
  revalidatePath("/erp/revenues");
  revalidatePath("/erp/accounting/receivables");
}

export async function updateProjectBudgetAction(projectId: string, budgetSold: number): Promise<void> {
  await updateProjectBudget(projectId, budgetSold);
  revalidate(projectId);
}

export async function setPaymentTypeAction(
  projectId: string,
  paymentType: "milestones" | "financing",
): Promise<void> {
  await updateProjectPaymentConfig(projectId, { payment_type: paymentType });
  revalidate(projectId);
}

export async function createProjectInstallmentAction(
  projectId: string,
  dealId: string,
  input: InstallmentInput,
): Promise<void> {
  const parsed = installmentSchema.parse(input);
  await createInstallmentForProject(projectId, dealId, parsed);
  revalidate(projectId);
}

export async function updateProjectInstallmentAction(
  projectId: string,
  id: string,
  input: InstallmentInput,
): Promise<void> {
  const parsed = installmentSchema.parse(input);
  await updateInstallment(id, parsed);
  revalidate(projectId);
}

export async function deleteProjectInstallmentAction(projectId: string, id: string): Promise<void> {
  await deleteInstallment(id);
  revalidate(projectId);
}

export async function generateProjectScheduleAction(
  projectId: string,
  dealId: string,
  config: FinancingConfigInput,
): Promise<void> {
  const parsed = financingConfigSchema.parse(config);
  await updateProjectPaymentConfig(projectId, {
    payment_type: "financing",
    financing_term_months: parsed.financing_term_months,
    interest_rate_annual: parsed.interest_rate_annual_pct / 100,
    credit_start_date: parsed.credit_start_date,
    down_payment: parsed.down_payment ?? 0,
  });
  await generateProjectFinancingSchedule(projectId, dealId);
  revalidate(projectId);
}

export async function deleteAllInstallmentsAction(projectId: string, dealId: string): Promise<void> {
  await deleteAllInstallmentsByDeal(dealId);
  revalidate(projectId);
}

export async function linkInstallmentToInvoiceAction(
  projectId: string,
  installmentId: string,
  invoiceId: string | null,
): Promise<void> {
  await linkInvoiceToInstallment(installmentId, invoiceId);
  revalidate(projectId);
}

export async function generateMilestoneScheduleAction(
  projectId: string,
  dealId: string,
  plan: MilestonePlanInput,
): Promise<void> {
  const parsed = milestonePlanSchema.parse(plan);
  await updateProjectPaymentConfig(projectId, { payment_type: "milestones" });
  await generateMilestoneSchedule(projectId, dealId, parsed.exhibitions);
  revalidate(projectId);
}

export async function uploadInstallmentInvoiceAction(
  projectId: string,
  installmentId: string,
  amount: number,
  dueDate: string | null,
  formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const project = await getProject(projectId);
  if (!project?.account?.id) throw new Error("El proyecto no tiene cuenta asociada");

  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await createInvoiceFromInstallment(
    installmentId,
    projectId,
    project.account.id,
    user.id,
    amount,
    dueDate,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidate(projectId);
  revalidatePath("/erp/accounting/receivables");
}

export async function updateInstallmentStatusAction(
  projectId: string,
  id: string,
  status: "pending" | "paid",
): Promise<void> {
  await updateInstallmentStatus(id, status);
  revalidate(projectId);
  revalidatePath("/erp/accounting/receivables");
  revalidatePath("/erp/accounting/balance-sheet");
}

export async function uploadInstallmentComplementAction(
  projectId: string,
  installmentId: string,
  formData: FormData,
): Promise<void> {
  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await uploadInstallmentComplement(
    installmentId,
    projectId,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidate(projectId);
}
