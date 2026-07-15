"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerPaymentSchema } from "@/lib/validations/customer-payment";
import {
  createCustomerPayment,
  applyPaymentToInvoice,
  removeInvoiceApplication,
  deleteCustomerPayment,
  uploadPaymentComplement,
} from "@/services/customer-payments.service";
import { getProject } from "@/services/projects.service";

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/finances`);
  revalidatePath("/erp/invoices");
}

export async function createPaymentAction(projectId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const project = await getProject(projectId);
  if (!project?.account?.id) throw new Error("El proyecto no tiene cuenta asociada");

  const parsed = customerPaymentSchema.parse({
    paid_at: formData.get("paid_at"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    bank_reference: formData.get("bank_reference"),
    bank_account: formData.get("bank_account"),
    notes: formData.get("notes"),
  });

  const receipt = formData.get("receipt");
  const paymentId = await createCustomerPayment(
    projectId,
    project.account.id,
    user.id,
    parsed,
    receipt instanceof File ? receipt : null,
  );

  // Optionally apply to a specific invoice in the same action
  const invoiceId = formData.get("invoice_id");
  const amountApplied = formData.get("amount_applied");
  if (invoiceId && typeof invoiceId === "string" && invoiceId.trim()) {
    const amount = Number(amountApplied) || parsed.amount;
    await applyPaymentToInvoice(paymentId, invoiceId, amount);
  }

  revalidate(projectId);
}

export async function applyPaymentAction(
  projectId: string,
  paymentId: string,
  invoiceId: string,
  amountApplied: number,
): Promise<void> {
  await applyPaymentToInvoice(paymentId, invoiceId, amountApplied);
  revalidate(projectId);
}

export async function removeApplicationAction(
  projectId: string,
  paymentId: string,
  invoiceId: string,
): Promise<void> {
  await removeInvoiceApplication(paymentId, invoiceId);
  revalidate(projectId);
}

export async function deletePaymentAction(projectId: string, paymentId: string): Promise<void> {
  await deleteCustomerPayment(paymentId);
  revalidate(projectId);
}

export async function uploadPaymentComplementAction(
  projectId: string,
  paymentId: string,
  formData: FormData,
): Promise<void> {
  const pdf = formData.get("complement_pdf");
  const xml = formData.get("complement_xml");
  await uploadPaymentComplement(
    paymentId,
    projectId,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidate(projectId);
}
