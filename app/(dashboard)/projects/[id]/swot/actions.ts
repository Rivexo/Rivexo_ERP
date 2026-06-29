"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { swotSchema, type SwotInput } from "@/lib/validations/swot";
import { createSwotItem, deleteSwotItem } from "@/services/swot.service";

export async function createSwotItemAction(projectId: string, input: SwotInput): Promise<void> {
  const parsed = swotSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await createSwotItem(projectId, parsed, user.id);
  revalidatePath(`/projects/${projectId}/swot`);
}

export async function deleteSwotItemAction(projectId: string, id: string): Promise<void> {
  await deleteSwotItem(id);
  revalidatePath(`/projects/${projectId}/swot`);
}
