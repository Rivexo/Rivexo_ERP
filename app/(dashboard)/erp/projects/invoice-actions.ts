"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerInvoiceSchema } from "@/lib/validations/customer-invoice";
import {
  createCustomerInvoice,
  deleteCustomerInvoice,
  updateCustomerInvoiceStatus,
  uploadInvoiceFiles,
  type InvoiceStatus,
} from "@/services/customer-invoices.service";
import { getProject } from "@/services/projects.service";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/erp/projects/${projectId}`);
  revalidatePath("/erp/projects");
  revalidatePath("/erp/invoices");
  revalidatePath("/erp/accounting/receivables");
}

export async function createInvoiceAction(projectId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const project = await getProject(projectId);
  if (!project?.account?.id) throw new Error("El proyecto no tiene cuenta asociada");

  const parsed = customerInvoiceSchema.parse({
    folio: formData.get("folio"),
    serie: formData.get("serie"),
    uuid_fiscal: formData.get("uuid_fiscal"),
    issued_at: formData.get("issued_at"),
    due_at: formData.get("due_at"),
    subtotal: formData.get("subtotal"),
    notes: formData.get("notes"),
  });

  const invoiceId = await createCustomerInvoice(projectId, project.account.id, user.id, parsed);

  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await uploadInvoiceFiles(
    invoiceId,
    projectId,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );

  revalidate(projectId);
}

export async function uploadInvoiceFilesAction(
  projectId: string,
  invoiceId: string,
  formData: FormData,
): Promise<void> {
  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await uploadInvoiceFiles(
    invoiceId,
    projectId,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidate(projectId);
}

export async function updateInvoiceStatusAction(
  projectId: string,
  invoiceId: string,
  status: InvoiceStatus,
): Promise<void> {
  await updateCustomerInvoiceStatus(invoiceId, status);
  revalidate(projectId);
}

export async function deleteInvoiceAction(projectId: string, invoiceId: string): Promise<void> {
  await deleteCustomerInvoice(invoiceId);
  revalidate(projectId);
}
