import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { SupportSubscriptionInput } from "@/lib/validations/support-subscription";

export type SupportSubscription = Database["public"]["Tables"]["monthly_support_subscriptions"]["Row"];

export type SupportSubscriptionWithRelations = SupportSubscription & {
  account: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

export async function listSupportSubscriptions(): Promise<SupportSubscriptionWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_support_subscriptions")
    .select("*, account:accounts(id, name), project:projects(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as SupportSubscriptionWithRelations[];
}

export async function createSupportSubscription(input: SupportSubscriptionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_support_subscriptions").insert(input);
  if (error) throw error;
}

export async function updateSupportSubscription(id: string, input: SupportSubscriptionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_support_subscriptions").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteSupportSubscription(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_support_subscriptions").delete().eq("id", id);
  if (error) throw error;
}
