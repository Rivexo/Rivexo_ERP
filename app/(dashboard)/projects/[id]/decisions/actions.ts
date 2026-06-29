"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decisionSchema, type DecisionInput } from "@/lib/validations/decision";
import { createDecision, deleteDecision } from "@/services/decisions.service";
import { logActivity } from "@/services/activity.service";

export async function createDecisionAction(projectId: string, input: DecisionInput): Promise<void> {
  const parsed = decisionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await createDecision(projectId, parsed, user.id);
  await logActivity("project", projectId, "decision_logged", user.id, `Decisión registrada: "${parsed.title}"`);
  revalidatePath(`/projects/${projectId}/decisions`);
}

export async function deleteDecisionAction(projectId: string, id: string): Promise<void> {
  await deleteDecision(id);
  revalidatePath(`/projects/${projectId}/decisions`);
}
