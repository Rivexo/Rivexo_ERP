import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { FixedCostInput } from "@/lib/validations/fixed-cost";

export type FixedCost = Database["public"]["Tables"]["fixed_costs"]["Row"];

export type FixedCostWithRelations = FixedCost & {
  category: { id: string; name: string } | null;
};

export async function listFixedCosts(): Promise<FixedCostWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*, category:expense_categories(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as FixedCostWithRelations[];
}

export async function createFixedCost(input: FixedCostInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_costs").insert(input);
  if (error) throw error;
}

export async function updateFixedCost(id: string, input: FixedCostInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_costs").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteFixedCost(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
  if (error) throw error;
}
