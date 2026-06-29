import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { VariableExpenseInput } from "@/lib/validations/variable-expense";

export type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

export type VariableExpenseWithRelations = VariableExpense & {
  category: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

export async function listVariableExpenses(): Promise<VariableExpenseWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("variable_expenses")
    .select("*, category:expense_categories(id, name), project:projects(id, name)")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data as unknown as VariableExpenseWithRelations[];
}

export async function createVariableExpense(input: VariableExpenseInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("variable_expenses").insert(input);
  if (error) throw error;
}

export async function updateVariableExpense(id: string, input: VariableExpenseInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("variable_expenses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteVariableExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("variable_expenses").delete().eq("id", id);
  if (error) throw error;
}
