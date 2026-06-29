"use server";

import { revalidatePath } from "next/cache";
import { deleteFile, uploadFile } from "@/services/files.service";

export async function uploadContractAction(dealId: string, formData: FormData): Promise<void> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo");
  }
  await uploadFile("deal", dealId, file);
  revalidatePath(`/crm/deals/${dealId}`);
}

export async function deleteContractAction(dealId: string, id: string): Promise<void> {
  await deleteFile(id);
  revalidatePath(`/crm/deals/${dealId}`);
}
