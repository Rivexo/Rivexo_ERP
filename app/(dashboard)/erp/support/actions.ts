"use server";

import { revalidatePath } from "next/cache";
import { supportSubscriptionSchema, type SupportSubscriptionInput } from "@/lib/validations/support-subscription";
import {
  createSupportSubscription,
  deleteSupportSubscription,
  updateSupportSubscription,
} from "@/services/support-subscriptions.service";

export async function createSupportSubscriptionAction(input: SupportSubscriptionInput): Promise<void> {
  const parsed = supportSubscriptionSchema.parse(input);
  await createSupportSubscription(parsed);
  revalidatePath("/erp/support");
}

export async function updateSupportSubscriptionAction(id: string, input: SupportSubscriptionInput): Promise<void> {
  const parsed = supportSubscriptionSchema.parse(input);
  await updateSupportSubscription(id, parsed);
  revalidatePath("/erp/support");
}

export async function deleteSupportSubscriptionAction(id: string): Promise<void> {
  await deleteSupportSubscription(id);
  revalidatePath("/erp/support");
}
