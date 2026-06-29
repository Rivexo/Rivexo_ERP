import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { RiskInput } from "@/lib/validations/risk";

export type ProjectRisk = Database["public"]["Tables"]["project_risks"]["Row"];

export type ProjectRiskWithRelations = ProjectRisk & {
  owner: { id: string; full_name: string } | null;
};

export async function listProjectRisks(projectId: string): Promise<ProjectRiskWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_risks")
    .select("*, owner:profiles(id, full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ProjectRiskWithRelations[];
}

export async function createRisk(projectId: string, input: RiskInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_risks").insert({ ...input, project_id: projectId });
  if (error) throw error;
}

export async function updateRisk(id: string, input: RiskInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_risks").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteRisk(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_risks").delete().eq("id", id);
  if (error) throw error;
}
