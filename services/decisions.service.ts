import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { DecisionInput } from "@/lib/validations/decision";

export type ProjectDecision = Database["public"]["Tables"]["project_decisions"]["Row"];

export type ProjectDecisionWithRelations = ProjectDecision & {
  decided_by_profile: { id: string; full_name: string } | null;
};

export async function listProjectDecisions(projectId: string): Promise<ProjectDecisionWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_decisions")
    .select("*, decided_by_profile:profiles!project_decisions_decided_by_fkey(id, full_name)")
    .eq("project_id", projectId)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ProjectDecisionWithRelations[];
}

export async function createDecision(projectId: string, input: DecisionInput, decidedBy: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_decisions").insert({
    ...input,
    decided_at: input.decided_at ?? new Date().toISOString().slice(0, 10),
    project_id: projectId,
    decided_by: decidedBy,
  });
  if (error) throw error;
}

export async function deleteDecision(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_decisions").delete().eq("id", id);
  if (error) throw error;
}
