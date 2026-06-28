"use server";

import { revalidatePath } from "next/cache";
import { contactSchema, type ContactInput } from "@/lib/validations/contact";
import { createContact, softDeleteContact, updateContact } from "@/services/contacts.service";

export async function createContactAction(input: ContactInput): Promise<void> {
  const parsed = contactSchema.parse(input);
  await createContact(parsed);
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/accounts/${parsed.account_id}`);
}

export async function updateContactAction(id: string, input: ContactInput): Promise<void> {
  const parsed = contactSchema.parse(input);
  await updateContact(id, parsed);
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/accounts/${parsed.account_id}`);
}

export async function deleteContactAction(id: string, accountId: string): Promise<void> {
  await softDeleteContact(id);
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/accounts/${accountId}`);
}
