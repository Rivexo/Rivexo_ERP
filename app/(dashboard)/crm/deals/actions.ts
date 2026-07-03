"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dealSchema, type DealInput } from "@/lib/validations/deal";
import { installmentSchema, type InstallmentInput } from "@/lib/validations/installment";
import { createDeal, softDeleteDeal, updateDeal, updateDealStage } from "@/services/deals.service";
import {
  createInstallment,
  deleteInstallment,
  generateFinancingSchedule,
  updateInstallment,
} from "@/services/installments.service";
import { getProjectByDealId } from "@/services/projects.service";

export async function createDealAction(input: DealInput): Promise<{ id: string }> {
  const parsed = dealSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const deal = await createDeal(parsed, user.id);
  revalidatePath("/crm/deals");
  revalidatePath("/crm/pipeline");
  return { id: deal.id };
}

export async function updateDealAction(id: string, input: DealInput): Promise<void> {
  const parsed = dealSchema.parse(input);
  await updateDeal(id, parsed);
  revalidatePath("/crm/deals");
  revalidatePath("/crm/pipeline");
  revalidatePath(`/crm/deals/${id}`);
}

export async function deleteDealAction(id: string): Promise<void> {
  await softDeleteDeal(id);
  revalidatePath("/crm/deals");
  revalidatePath("/crm/pipeline");
}

export async function updateDealStageAction(
  dealId: string,
  stage: { id: string; is_won: boolean; is_lost: boolean },
  lostReason?: string,
): Promise<void> {
  await updateDealStage(dealId, stage, lostReason);
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/deals");
  revalidatePath(`/crm/deals/${dealId}`);
}

export async function convertDealToProjectAction(dealId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_deal_to_project", { p_deal_id: dealId });
  if (error) throw error;
  revalidatePath(`/crm/deals/${dealId}`);
  revalidatePath("/projects");
  redirect(`/projects/${data}`);
}

async function revalidateInstallmentPaths(dealId: string): Promise<void> {
  revalidatePath(`/crm/deals/${dealId}`);
  const project = await getProjectByDealId(dealId);
  if (project) revalidatePath(`/projects/${project.id}`);
  revalidatePath("/erp/accounting/receivables");
}

export async function createInstallmentAction(dealId: string, input: InstallmentInput): Promise<void> {
  const parsed = installmentSchema.parse(input);
  await createInstallment(dealId, parsed);
  await revalidateInstallmentPaths(dealId);
}

export async function updateInstallmentAction(dealId: string, id: string, input: InstallmentInput): Promise<void> {
  const parsed = installmentSchema.parse(input);
  await updateInstallment(id, parsed);
  await revalidateInstallmentPaths(dealId);
}

export async function deleteInstallmentAction(dealId: string, id: string): Promise<void> {
  await deleteInstallment(id);
  await revalidateInstallmentPaths(dealId);
}

export async function generateFinancingScheduleAction(dealId: string): Promise<void> {
  await generateFinancingSchedule(dealId);
  await revalidateInstallmentPaths(dealId);
}
