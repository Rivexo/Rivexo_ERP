"use server";

import { revalidatePath } from "next/cache";
import { ideasPhaseSchema, type IdeasPhaseInput } from "@/lib/validations/ideas-phase";
import { updateProjectIdeasPhase } from "@/services/ideas.service";

export async function updateIdeasPhaseAction(projectId: string, id: string, input: IdeasPhaseInput): Promise<void> {
  const parsed = ideasPhaseSchema.parse(input);
  await updateProjectIdeasPhase(id, parsed);
  revalidatePath(`/projects/${projectId}/ideas`);
}
