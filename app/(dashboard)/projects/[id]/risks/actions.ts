"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { riskSchema, type RiskInput } from "@/lib/validations/risk";
import { createRisk, deleteRisk, updateRisk } from "@/services/risks.service";
import { logActivity } from "@/services/activity.service";

export async function createRiskAction(projectId: string, input: RiskInput): Promise<void> {
  const parsed = riskSchema.parse(input);
  await createRisk(projectId, parsed);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await logActivity("project", projectId, "risk_created", user.id, `Riesgo registrado: "${parsed.description}"`);
  }
  revalidatePath(`/projects/${projectId}/risks`);
}

export async function updateRiskAction(projectId: string, id: string, input: RiskInput): Promise<void> {
  const parsed = riskSchema.parse(input);
  await updateRisk(id, parsed);
  revalidatePath(`/projects/${projectId}/risks`);
}

export async function deleteRiskAction(projectId: string, id: string): Promise<void> {
  await deleteRisk(id);
  revalidatePath(`/projects/${projectId}/risks`);
}
