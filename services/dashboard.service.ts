import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type CrmDashboard = Database["public"]["Views"]["v_crm_dashboard"]["Row"];

export async function getCrmDashboard(): Promise<CrmDashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_crm_dashboard").select("*").single();
  if (error) throw error;
  return data;
}
