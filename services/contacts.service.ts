import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { ContactInput } from "@/lib/validations/contact";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactWithAccount = Contact & { account: { name: string } | null };

export async function listContactsByAccount(accountId: string): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("account_id", accountId)
    .is("deleted_at", null)
    .order("is_primary", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listContacts(): Promise<ContactWithAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, account:accounts(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ContactWithAccount[];
}

export async function getContact(id: string): Promise<Contact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contacts").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, input: ContactInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update(input).eq("id", id);
  if (error) throw error;
}

export async function softDeleteContact(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
