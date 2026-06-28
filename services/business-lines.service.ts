import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type BusinessLine = Database["public"]["Tables"]["business_lines"]["Row"];

export async function listBusinessLines(): Promise<BusinessLine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("business_lines").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createBusinessLine(name: string, slug: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("business_lines").insert({ name, slug });
  if (error) throw error;
}

export async function updateBusinessLine(id: string, fields: Partial<Pick<BusinessLine, "name" | "slug" | "is_active">>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("business_lines").update(fields).eq("id", id);
  if (error) throw error;
}
