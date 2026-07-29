import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { CustomerPaymentInput } from "@/lib/validations/customer-payment";
import type { InvoiceStatus } from "@/services/customer-invoices.service";

export type CustomerPayment = Database["public"]["Tables"]["customer_payments"]["Row"];

export type AppliedInvoice = {
  invoice_id: string;
  amount_applied: number;
  invoice_folio: string | null;
  invoice_total: number;
};

export type CustomerPaymentWithReconciliation = CustomerPayment & {
  receipt_url: string | null;
  complement_pdf_url: string | null;
  complement_xml_url: string | null;
  total_applied: number;
  remaining: number;
  applied_invoices: AppliedInvoice[];
};

export type PendingInvoiceOption = {
  id: string;
  folio_display: string;
  subtotal: number;
  total: number;
  already_applied: number;
  balance_due: number;
  status: InvoiceStatus;
};

const BUCKET = "payments";
const SIGNED_URL_TTL = 3600;

export async function listPaymentsByProject(projectId: string): Promise<CustomerPaymentWithReconciliation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_payments")
    .select(
      `*, invoice_payments(
        amount_applied,
        invoice:customer_invoices(id, folio, serie, total)
      )`
    )
    .eq("project_id", projectId)
    .order("paid_at", { ascending: false });
  if (error) throw error;

  type RawPayment = CustomerPayment & {
    invoice_payments: {
      amount_applied: number;
      invoice: { id: string; folio: string | null; serie: string | null; total: number } | null;
    }[];
  };

  return Promise.all(
    (data as unknown as RawPayment[]).map(async (row) => {
      const [receiptSigned, complementPdfSigned, complementXmlSigned] = await Promise.all([
        row.receipt_path
          ? supabase.storage.from(BUCKET).createSignedUrl(row.receipt_path, SIGNED_URL_TTL)
          : Promise.resolve({ data: null }),
        row.complement_pdf_path
          ? supabase.storage.from(BUCKET).createSignedUrl(row.complement_pdf_path, SIGNED_URL_TTL)
          : Promise.resolve({ data: null }),
        row.complement_xml_path
          ? supabase.storage.from(BUCKET).createSignedUrl(row.complement_xml_path, SIGNED_URL_TTL)
          : Promise.resolve({ data: null }),
      ]);

      const receiptUrl = receiptSigned.data?.signedUrl ?? null;
      const complementPdfUrl = complementPdfSigned.data?.signedUrl ?? null;
      const complementXmlUrl = complementXmlSigned.data?.signedUrl ?? null;

      const appliedInvoices: AppliedInvoice[] = row.invoice_payments
        .filter((ip) => ip.invoice)
        .map((ip) => ({
          invoice_id: ip.invoice!.id,
          amount_applied: ip.amount_applied,
          invoice_folio: [ip.invoice!.serie, ip.invoice!.folio].filter(Boolean).join("-") || null,
          invoice_total: ip.invoice!.total,
        }));

      const totalApplied = appliedInvoices.reduce((s, i) => s + i.amount_applied, 0);

      return {
        ...row,
        receipt_url: receiptUrl,
        complement_pdf_url: complementPdfUrl,
        complement_xml_url: complementXmlUrl,
        total_applied: totalApplied,
        remaining: row.amount - totalApplied,
        applied_invoices: appliedInvoices,
      };
    }),
  );
}

export async function listPendingInvoicesForProject(projectId: string): Promise<PendingInvoiceOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_invoices")
    .select(`id, folio, serie, subtotal, total, status, invoice_payments(amount_applied)`)
    .eq("project_id", projectId)
    .not("status", "in", '("pagada","cancelada")')
    .order("issued_at", { ascending: true });
  if (error) throw error;

  type RawInvoice = {
    id: string;
    folio: string | null;
    serie: string | null;
    subtotal: number;
    total: number;
    status: InvoiceStatus;
    invoice_payments: { amount_applied: number }[];
  };

  return (data as unknown as RawInvoice[]).map((inv) => {
    const alreadyApplied = inv.invoice_payments.reduce((s, ip) => s + ip.amount_applied, 0);
    return {
      id: inv.id,
      folio_display: [inv.serie, inv.folio].filter(Boolean).join("-") || "(sin folio)",
      subtotal: inv.subtotal,
      total: inv.total,
      already_applied: alreadyApplied,
      balance_due: inv.total - alreadyApplied,
      status: inv.status,
    };
  });
}

export async function createCustomerPayment(
  projectId: string,
  accountId: string,
  createdBy: string,
  input: CustomerPaymentInput,
  receiptFile?: File | null,
  complementPdfFile?: File | null,
  complementXmlFile?: File | null,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_payments")
    .insert({
      project_id: projectId,
      account_id: accountId,
      created_by: createdBy,
      paid_at: input.paid_at,
      amount: input.amount,
      payment_method: input.payment_method ?? null,
      bank_reference: input.bank_reference ?? null,
      bank_account: input.bank_account ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const updates: { receipt_path?: string; complement_pdf_path?: string; complement_xml_path?: string } = {};

  if (receiptFile && receiptFile.size > 0) {
    const path = `${projectId}/${data.id}/comprobante.${receiptFile.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, receiptFile, { contentType: receiptFile.type, upsert: true });
    if (!uploadError) updates.receipt_path = path;
  }

  if (complementPdfFile && complementPdfFile.size > 0) {
    const path = `${projectId}/${data.id}/complemento.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, complementPdfFile, { contentType: "application/pdf", upsert: true });
    if (!uploadError) updates.complement_pdf_path = path;
  }

  if (complementXmlFile && complementXmlFile.size > 0) {
    const path = `${projectId}/${data.id}/complemento.xml`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, complementXmlFile, { contentType: "text/xml", upsert: true });
    if (!uploadError) updates.complement_xml_path = path;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from("customer_payments").update(updates).eq("id", data.id);
  }

  return data.id;
}

export async function uploadPaymentComplement(
  paymentId: string,
  projectId: string,
  pdfFile?: File | null,
  xmlFile?: File | null,
): Promise<void> {
  const supabase = await createClient();
  const updates: { complement_pdf_path?: string; complement_xml_path?: string } = {};

  if (pdfFile && pdfFile.size > 0) {
    const path = `${projectId}/${paymentId}/complemento.pdf`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    updates.complement_pdf_path = path;
  }

  if (xmlFile && xmlFile.size > 0) {
    const path = `${projectId}/${paymentId}/complemento.xml`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, xmlFile, { contentType: "text/xml", upsert: true });
    if (error) throw error;
    updates.complement_xml_path = path;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("customer_payments").update(updates).eq("id", paymentId);
    if (error) throw error;
  }
}

export async function applyPaymentToInvoice(
  paymentId: string,
  invoiceId: string,
  amountApplied: number,
): Promise<void> {
  const supabase = await createClient();

  const { error: insertError } = await supabase
    .from("invoice_payments")
    .upsert({ invoice_id: invoiceId, payment_id: paymentId, amount_applied: amountApplied });
  if (insertError) throw insertError;

  await refreshInvoiceStatus(supabase, invoiceId);
}

export async function removeInvoiceApplication(paymentId: string, invoiceId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoice_payments")
    .delete()
    .eq("payment_id", paymentId)
    .eq("invoice_id", invoiceId);
  if (error) throw error;

  await refreshInvoiceStatus(supabase, invoiceId);
}

async function refreshInvoiceStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
): Promise<void> {
  const { data: invoice } = await supabase
    .from("customer_invoices")
    .select("total")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return;

  const { data: payments } = await supabase
    .from("invoice_payments")
    .select("amount_applied")
    .eq("invoice_id", invoiceId);

  const totalApplied = (payments ?? []).reduce((s, p) => s + p.amount_applied, 0);

  // `total` is a generated column (subtotal * (1 + iva_rate)) and both inputs
  // are not-null, so it's never actually null here despite the nullable type.
  const invoiceTotal = invoice.total ?? 0;

  let status: InvoiceStatus;
  if (totalApplied >= invoiceTotal) {
    status = "pagada";
  } else if (totalApplied > 0) {
    status = "parcialmente_pagada";
  } else {
    status = "emitida";
  }

  await supabase.from("customer_invoices").update({ status }).eq("id", invoiceId);
}

export async function deleteCustomerPayment(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("customer_payments")
    .select("receipt_path, project_id")
    .eq("id", id)
    .single();

  if (row?.receipt_path) {
    await supabase.storage.from(BUCKET).remove([row.receipt_path]);
  }

  // Get affected invoices before deleting (cascade will remove invoice_payments)
  const { data: affected } = await supabase
    .from("invoice_payments")
    .select("invoice_id")
    .eq("payment_id", id);
  const invoiceIds = (affected ?? []).map((r) => r.invoice_id);

  const { error } = await supabase.from("customer_payments").delete().eq("id", id);
  if (error) throw error;

  // Refresh status for affected invoices
  await Promise.all(invoiceIds.map((iid) => refreshInvoiceStatus(supabase, iid)));
}
