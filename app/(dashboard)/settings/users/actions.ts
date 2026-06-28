"use server";

import { revalidatePath } from "next/cache";
import { updateProfileActive, updateProfileRole, type UserRole } from "@/services/profiles.service";

export async function updateProfileRoleAction(id: string, role: UserRole): Promise<void> {
  await updateProfileRole(id, role);
  revalidatePath("/settings/users");
}

export async function updateProfileActiveAction(id: string, isActive: boolean): Promise<void> {
  await updateProfileActive(id, isActive);
  revalidatePath("/settings/users");
}
