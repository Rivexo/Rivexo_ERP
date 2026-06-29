import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { SwotInput } from "@/lib/validations/swot";

export type ProjectSwot = Database["public"]["Tables"]["project_swot"]["Row"];

export async function listProjectSwot(projectId: string): Promise<ProjectSwot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_swot")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSwotItem(projectId: string, input: SwotInput, createdBy: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_swot")
    .insert({ ...input, project_id: projectId, created_by: createdBy });
  if (error) throw error;
}

export async function deleteSwotItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_swot").delete().eq("id", id);
  if (error) throw error;
}
