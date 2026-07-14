"use server";

import { revalidatePath } from "next/cache";
import { installmentSchema, type InstallmentInput } from "@/lib/validations/installment";
import { financingConfigSchema, type FinancingConfigInput } from "@/lib/validations/project-payment";
import {
  createInstallmentForProject,
  updateInstallment,
  deleteInstallment,
  deleteAllInstallmentsByDeal,
  generateProjectFinancingSchedule,
  linkInvoiceToInstallment,
} from "@/services/installments.service";
import { updateProjectPaymentConfig } from "@/services/projects.service";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/erp/revenues");
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
