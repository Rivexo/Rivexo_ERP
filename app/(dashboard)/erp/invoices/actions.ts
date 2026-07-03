"use server";

import { revalidatePath } from "next/cache";
import {
  deleteCustomerInvoice,
  updateCustomerInvoiceStatus,
  uploadInvoiceFiles,
  type InvoiceStatus,
} from "@/services/customer-invoices.service";

function revalidate() {
  revalidatePath("/erp/invoices");
}

export async function uploadInvoiceFilesGlobalAction(
  invoiceId: string,
  formData: FormData,
): Promise<void> {
  const { data: row } = await (await import("@/lib/supabase/server").then((m) => m.createClient()))
    .from("customer_invoices")
    .select("project_id")
    .eq("id", invoiceId)
    .single();

  const projectId = row?.project_id ?? "unknown";
  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await uploadInvoiceFiles(
    invoiceId,
    projectId,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidate();
  revalidatePath(`/projects/${projectId}`);
}

export async function updateInvoiceStatusGlobalAction(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<void> {
  await updateCustomerInvoiceStatus(invoiceId, status);
  revalidate();
}

export async function deleteInvoiceGlobalAction(invoiceId: string): Promise<void> {
  await deleteCustomerInvoice(invoiceId);
  revalidate();
}
