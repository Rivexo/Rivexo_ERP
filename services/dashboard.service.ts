import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type CrmDashboard = Database["public"]["Views"]["v_crm_dashboard"]["Row"];
export type DealsByStage = Database["public"]["Views"]["v_deals_by_stage"]["Row"];
export type DealsWonLostMonthly = Database["public"]["Views"]["v_deals_won_lost_monthly"]["Row"];

export async function getCrmDashboard(): Promise<CrmDashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_crm_dashboard").select("*").single();
  if (error) throw error;
  return data;
}

export async function getDealsByStage(): Promise<DealsByStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_deals_by_stage").select("*").order("order_index");
  if (error) throw error;
  return data;
}

export async function getDealsWonLostMonthly(): Promise<DealsWonLostMonthly[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_deals_won_lost_monthly").select("*").order("month");
  if (error) throw error;
  return data;
}
