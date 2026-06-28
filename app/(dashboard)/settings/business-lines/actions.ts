"use server";

import { revalidatePath } from "next/cache";
import { createBusinessLine, updateBusinessLine } from "@/services/business-lines.service";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBusinessLineAction(name: string): Promise<void> {
  await createBusinessLine(name, slugify(name));
  revalidatePath("/settings/business-lines");
}

export async function toggleBusinessLineActiveAction(id: string, isActive: boolean): Promise<void> {
  await updateBusinessLine(id, { is_active: isActive });
  revalidatePath("/settings/business-lines");
}
