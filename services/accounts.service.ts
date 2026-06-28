import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { AccountInput } from "@/lib/validations/account";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type AccountWithOwner = Account & { owner: { full_name: string } | null };

export async function listAccounts(): Promise<AccountWithOwner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, owner:profiles!accounts_owner_id_fkey(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as AccountWithOwner[];
}

export async function getAccount(id: string): Promise<Account | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createAccount(input: AccountInput, createdBy: string): Promise<Account> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({ ...input, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(id: string, input: AccountInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(input).eq("id", id);
  if (error) throw error;
}

export async function softDeleteAccount(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function listAccountOptions(): Promise<Pick<Account, "id" | "name">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return data;
}
