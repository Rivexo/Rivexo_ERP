"use server";

import { revalidatePath } from "next/cache";
import { costInstallmentSchema, type CostInstallmentInput } from "@/lib/validations/cost-installment";
import { updateProjectPaymentConfig } from "@/services/projects.service";
import {
  createCostInstallment,
  updateCostInstallment,
  deleteCostInstallment,
  deleteAllCostInstallments,
  generateCostScheduleFromCollection,
  linkFreelancerInvoiceToCostInstallment,
} from "@/services/project-cost-schedule.service";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
}

export async function setCostPaymentTypeAction(
  projectId: string,
  costPaymentType: string,
): Promise<void> {
  await updateProjectPaymentConfig(projectId, { cost_payment_type: costPaymentType });
  revalidate(projectId);
}

export async function createCostInstallmentAction(
  projectId: string,
  dealId: string,
  input: CostInstallmentInput,
): Promise<void> {
  const parsed = costInstallmentSchema.parse(input);
  await createCostInstallment(projectId, dealId, parsed);
  revalidate(projectId);
}

export async function updateCostInstallmentAction(
  projectId: string,
  id: string,
  input: CostInstallmentInput,
): Promise<void> {
  const parsed = costInstallmentSchema.parse(input);
  await updateCostInstallment(id, parsed);
  revalidate(projectId);
}

export async function deleteCostInstallmentAction(projectId: string, id: string): Promise<void> {
  await deleteCostInstallment(id);
  revalidate(projectId);
}

export async function generateCostScheduleAction(projectId: string, dealId: string): Promise<void> {
  await generateCostScheduleFromCollection(projectId, dealId);
  revalidate(projectId);
}

export async function deleteAllCostInstallmentsAction(projectId: string): Promise<void> {
  await deleteAllCostInstallments(projectId);
  revalidate(projectId);
}

export async function linkFreelancerInvoiceAction(
  projectId: string,
  installmentId: string,
  invoiceId: string | null,
): Promise<void> {
  await linkFreelancerInvoiceToCostInstallment(installmentId, invoiceId);
  revalidate(projectId);
}
