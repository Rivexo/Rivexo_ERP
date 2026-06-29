import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { FixedCostInput } from "@/lib/validations/fixed-cost";
import { postJournalEntry } from "@/services/accounting.service";

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

// Registra en el diario los costos fijos activos del mes en curso (Cargo Costos Fijos /
// Abono Caja). Idempotente: si un costo ya tiene un asiento este mes, no lo duplica.
// Los de frecuencia anual se reconocen 1/12 cada mes (mismo criterio que el KPI del dashboard).
export async function postMonthlyFixedCosts(): Promise<number> {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { data: costs, error: costsError } = await supabase
    .from("fixed_costs")
    .select("id, name, amount, frequency")
    .eq("is_active", true)
    .lte("effective_date", todayStr)
    .or(`end_date.is.null,end_date.gte.${todayStr}`);
  if (costsError) throw costsError;
  if (!costs.length) return 0;

  const { data: postedEntries, error: postedError } = await supabase
    .from("journal_entries")
    .select("source_id")
    .eq("source_type", "fixed_cost")
    .gte("entry_date", monthStart)
    .lte("entry_date", todayStr)
    .in("source_id", costs.map((c) => c.id));
  if (postedError) throw postedError;
  const alreadyPosted = new Set(postedEntries.map((e) => e.source_id));

  const pending = costs.filter((c) => !alreadyPosted.has(c.id));
  for (const cost of pending) {
    const amount = cost.frequency === "annual" ? Math.round((cost.amount / 12) * 100) / 100 : cost.amount;
    await postJournalEntry(todayStr, `Costo fijo del mes: ${cost.name}`, "fixed_cost", cost.id, [
      { accountCode: "5400", debit: amount },
      { accountCode: "1100", credit: amount },
    ]);
  }
  return pending.length;
}
