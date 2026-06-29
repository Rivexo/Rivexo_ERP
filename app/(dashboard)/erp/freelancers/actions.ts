"use server";

import { revalidatePath } from "next/cache";
import { freelancerInvoiceSchema } from "@/lib/validations/freelancer-invoice";
import {
  createFreelancerInvoice,
  deleteFreelancerInvoice,
  updateFreelancerInvoiceStatus,
} from "@/services/freelancer-invoices.service";
import { deleteFile, listFiles, uploadFile } from "@/services/files.service";

export async function createFreelancerInvoiceAction(formData: FormData): Promise<void> {
  const parsed = freelancerInvoiceSchema.parse({
    project_id: formData.get("project_id"),
    freelancer_name: formData.get("freelancer_name"),
    amount: formData.get("amount"),
    invoice_date: formData.get("invoice_date"),
    due_date: formData.get("due_date"),
    status: "pending",
    notes: null,
  });

  const invoiceId = await createFreelancerInvoice(parsed);

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    await uploadFile("freelancer_invoice", invoiceId, file, "freelancer-invoices");
  }

  revalidatePath("/erp/freelancers");
  revalidatePath(`/projects/${parsed.project_id}`);
}

export async function toggleFreelancerInvoiceStatusAction(id: string, status: "pending" | "paid"): Promise<void> {
  await updateFreelancerInvoiceStatus(id, status);
  revalidatePath("/erp/freelancers");
}

export async function deleteFreelancerInvoiceAction(id: string): Promise<void> {
  const files = await listFiles("freelancer_invoice", id);
  await Promise.all(files.map((f) => deleteFile(f.id)));
  await deleteFreelancerInvoice(id);
  revalidatePath("/erp/freelancers");
}
