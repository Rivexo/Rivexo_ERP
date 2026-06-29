import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { ExpenseCategoryInput } from "@/lib/validations/expense-category";

export type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("expense_categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createExpenseCategory(input: ExpenseCategoryInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").insert(input);
  if (error) throw error;
}

export async function updateExpenseCategory(
  id: string,
  fields: Partial<Pick<ExpenseCategory, "name" | "kind" | "is_active">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expense_categories").update(fields).eq("id", id);
  if (error) throw error;
}
