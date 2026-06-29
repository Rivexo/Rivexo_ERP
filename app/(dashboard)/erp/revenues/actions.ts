"use server";

import { revalidatePath } from "next/cache";
import { revenueSchema, type RevenueInput } from "@/lib/validations/revenue";
import { createRevenue, deleteRevenue, updateRevenue } from "@/services/revenues.service";

export async function createRevenueAction(input: RevenueInput): Promise<void> {
  const parsed = revenueSchema.parse(input);
  await createRevenue(parsed);
  revalidatePath("/erp/revenues");
}

export async function updateRevenueAction(id: string, input: RevenueInput): Promise<void> {
  const parsed = revenueSchema.parse(input);
  await updateRevenue(id, parsed);
  revalidatePath("/erp/revenues");
}

export async function deleteRevenueAction(id: string): Promise<void> {
  await deleteRevenue(id);
  revalidatePath("/erp/revenues");
}
