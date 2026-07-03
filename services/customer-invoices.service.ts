import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { CustomerInvoiceInput } from "@/lib/validations/customer-invoice";

export type CustomerInvoice = Database["public"]["Tables"]["customer_invoices"]["Row"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

export type CustomerInvoiceWithRelations = CustomerInvoice & {
  project: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
  pdf_url: string | null;
  xml_url: string | null;
};

const SIGNED_URL_TTL = 3600;
const BUCKET = "invoices";

async function attachUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: CustomerInvoice[],
): Promise<CustomerInvoiceWithRelations[]> {
  return Promise.all(
    rows.map(async (row) => {
      const [pdf, xml] = await Promise.all([
        row.pdf_path
          ? supabase.storage.from(BUCKET).createSignedUrl(row.pdf_path, SIGNED_URL_TTL).then((r) => r.data?.signedUrl ?? null)
          : Promise.resolve(null),
        row.xml_path
          ? supabase.storage.from(BUCKET).createSignedUrl(row.xml_path, SIGNED_URL_TTL).then((r) => r.data?.signedUrl ?? null)
          : Promise.resolve(null),
      ]);
      return {
        ...(row as unknown as CustomerInvoice & { project: null; account: null }),
        pdf_url: pdf,
        xml_url: xml,
      };
    }),
  );
}

export async function listInvoicesByProject(projectId: string): Promise<CustomerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_invoices")
    .select("*, project:projects(id, name), account:accounts(id, name)")
    .eq("project_id", projectId)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return attachUrls(supabase, data as unknown as CustomerInvoice[]);
}

export async function listAllInvoices(): Promise<CustomerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_invoices")
    .select("*, project:projects(id, name), account:accounts(id, name)")
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return attachUrls(supabase, data as unknown as CustomerInvoice[]);
}

export async function createCustomerInvoice(
  projectId: string,
  accountId: string,
  createdBy: string,
  input: CustomerInvoiceInput,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_invoices")
    .insert({
      project_id: projectId,
      account_id: accountId,
      created_by: createdBy,
      folio: input.folio ?? null,
      serie: input.serie ?? null,
      uuid_fiscal: input.uuid_fiscal ?? null,
      issued_at: input.issued_at,
      due_at: input.due_at ?? null,
      subtotal: input.subtotal,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function uploadInvoiceFiles(
  invoiceId: string,
  projectId: string,
  pdfFile?: File | null,
  xmlFile?: File | null,
): Promise<void> {
  const supabase = await createClient();

  const updates: { pdf_path?: string; xml_path?: string } = {};

  if (pdfFile && pdfFile.size > 0) {
    const path = `${projectId}/${invoiceId}/factura.pdf`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    updates.pdf_path = path;
  }

  if (xmlFile && xmlFile.size > 0) {
    const path = `${projectId}/${invoiceId}/factura.xml`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, xmlFile, { contentType: "text/xml", upsert: true });
    if (error) throw error;
    updates.xml_path = path;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("customer_invoices").update(updates).eq("id", invoiceId);
    if (error) throw error;
  }
}

export async function updateCustomerInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("customer_invoices").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomerInvoice(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: row, error: fetchError } = await supabase
    .from("customer_invoices")
    .select("project_id, pdf_path, xml_path")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const pathsToDelete = [row.pdf_path, row.xml_path].filter(Boolean) as string[];
  if (pathsToDelete.length > 0) {
    await supabase.storage.from(BUCKET).remove(pathsToDelete);
  }

  const { error } = await supabase.from("customer_invoices").delete().eq("id", id);
  if (error) throw error;
}
