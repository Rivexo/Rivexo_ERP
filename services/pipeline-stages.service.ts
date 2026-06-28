import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type PipelineStage = Database["public"]["Tables"]["pipeline_stages"]["Row"];

export async function listPipelineStages(): Promise<PipelineStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pipeline_stages").select("*").order("order_index");
  if (error) throw error;
  return data;
}

export async function createPipelineStage(input: { name: string; order_index: number; is_won: boolean; is_lost: boolean; color?: string }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_stages").insert(input);
  if (error) throw error;
}

export async function updatePipelineStage(
  id: string,
  fields: Partial<Pick<PipelineStage, "name" | "order_index" | "is_won" | "is_lost" | "color">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_stages").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deletePipelineStage(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_stages").delete().eq("id", id);
  if (error) throw error;
}
