import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { IdeasPhaseInput } from "@/lib/validations/ideas-phase";

export type IdeasPhase = Database["public"]["Tables"]["ideas_phases"]["Row"];
export type ProjectIdeasPhase = Database["public"]["Tables"]["project_ideas_phases"]["Row"];

export type ProjectIdeasPhaseWithRelations = ProjectIdeasPhase & {
  phase: IdeasPhase;
  owner: { id: string; full_name: string } | null;
};

export async function listProjectIdeasPhases(projectId: string): Promise<ProjectIdeasPhaseWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_ideas_phases")
    .select("*, phase:ideas_phases(*), owner:profiles(id, full_name)")
    .eq("project_id", projectId);
  if (error) throw error;
  const phases = data as unknown as ProjectIdeasPhaseWithRelations[];
  return phases.sort((a, b) => a.phase.order_index - b.phase.order_index);
}

export async function updateProjectIdeasPhase(id: string, input: IdeasPhaseInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_ideas_phases").update(input).eq("id", id);
  if (error) throw error;
}
