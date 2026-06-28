"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountSchema, type AccountInput } from "@/lib/validations/account";
import { createAccount, softDeleteAccount, updateAccount } from "@/services/accounts.service";

export async function createAccountAction(input: AccountInput): Promise<{ id: string }> {
  const parsed = accountSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const account = await createAccount(parsed, user.id);
  revalidatePath("/crm/accounts");
  return { id: account.id };
}

export async function updateAccountAction(id: string, input: AccountInput): Promise<void> {
  const parsed = accountSchema.parse(input);
  await updateAccount(id, parsed);
  revalidatePath("/crm/accounts");
  revalidatePath(`/crm/accounts/${id}`);
}

export async function deleteAccountAction(id: string): Promise<void> {
  await softDeleteAccount(id);
  revalidatePath("/crm/accounts");
}
