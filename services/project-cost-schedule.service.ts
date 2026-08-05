import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { CostInstallmentInput } from "@/lib/validations/cost-installment";
import { postJournalEntry, type JournalLineInput } from "@/services/accounting.service";
import { calcIvaBreakdown } from "@/lib/iva";

export type ProjectCostInstallment = Database["public"]["Tables"]["project_cost_installments"]["Row"];

export type ProjectCostInstallmentWithRelations = ProjectCostInstallment & {
  collection_installment: { label: string; amount: number; due_date: string | null } | null;
  freelancer_invoice: { id: string; freelancer_name: string; amount: number; status: string } | null;
};

export async function listCostInstallmentsByProject(
  projectId: string,
): Promise<ProjectCostInstallmentWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_cost_installments")
    .select(
      `*,
      collection_installment:deal_payment_installments(label, amount, due_date),
      freelancer_invoice:freelancer_invoices(id, freelancer_name, amount, status)`,
    )
    .eq("project_id", projectId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as unknown as ProjectCostInstallmentWithRelations[];
}

export async function createCostInstallment(
  projectId: string,
  dealId: string,
  input: CostInstallmentInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_cost_installments")
    .insert({ project_id: projectId, deal_id: dealId, ...input });
  if (error) throw error;
}

export async function updateCostInstallment(id: string, input: CostInstallmentInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_cost_installments").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCostInstallment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_cost_installments").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllCostInstallments(projectId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_cost_installments").delete().eq("project_id", projectId);
  if (error) throw error;
}

export async function generateCostScheduleFromCollection(projectId: string, dealId: string): Promise<void> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("project_cost_installments")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error("Ya existe un plan de costos. Usa Regenerar para reemplazarlo.");
  }

  const { data: fin, error: finError } = await supabase
    .from("project_financials")
    .select("budget_sold, direct_cost")
    .eq("project_id", projectId)
    .single();
  if (finError) throw finError;

  const { data: collectionRows, error: colError } = await supabase
    .from("deal_payment_installments")
    .select("id, label, amount, due_date")
    .eq("deal_id", dealId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (colError) throw colError;
  if (!collectionRows || collectionRows.length === 0) {
    throw new Error("No hay cuotas de cobranza para espejear. Define primero el plan de cobro.");
  }

  const budgetSold = fin.budget_sold || 1;
  const ratio = fin.direct_cost / budgetSold;

  const rows = collectionRows.map((col) => ({
    project_id: projectId,
    deal_id: dealId,
    collection_installment_id: col.id,
    label: col.label,
    amount: Math.round(col.amount * ratio * 100) / 100,
    due_date: col.due_date,
    status: "pending" as const,
  }));

  const { error } = await supabase.from("project_cost_installments").insert(rows);
  if (error) throw error;
}

// Al igual que installments.service.ts::updateInstallmentStatus, el asiento se
// postea en bruto (con IVA) para que "Pagado" cuadre con "Costo total" (que
// ahora se muestra con IVA). El IVA que pagamos al proveedor es acreditable
// (1150), no un gasto — se descuenta después contra el IVA trasladado (2200).
export async function updateCostInstallmentStatus(id: string, status: "pending" | "paid"): Promise<void> {
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("project_cost_installments")
    .select("amount, status, label, payee_type, project_id")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;

  const { error } = await supabase
    .from("project_cost_installments")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);
  if (error) throw error;

  if (current.status === status) return;

  let ivaRate = 0.16;
  if (current.project_id) {
    const { data: fin } = await supabase
      .from("project_financials")
      .select("iva_rate")
      .eq("project_id", current.project_id)
      .maybeSingle();
    if (fin?.iva_rate != null) ivaRate = fin.iva_rate;
  }
  const { ivaAmount, total } = calcIvaBreakdown(current.amount, ivaRate);

  const expenseAccountCode = current.payee_type === "employee" ? "5600" : "5500";
  const today = new Date().toISOString().slice(0, 10);

  const lines: JournalLineInput[] = [];
  if (status === "paid") {
    lines.push({ accountCode: expenseAccountCode, debit: current.amount });
    if (ivaAmount > 0) lines.push({ accountCode: "1150", debit: ivaAmount });
    lines.push({ accountCode: "1100", credit: total });
    await postJournalEntry(today, `Pago a proveedor: ${current.label}`, "cost_installment_payment", id, lines);
  } else {
    lines.push({ accountCode: "1100", debit: total });
    lines.push({ accountCode: expenseAccountCode, credit: current.amount });
    if (ivaAmount > 0) lines.push({ accountCode: "1150", credit: ivaAmount });
    await postJournalEntry(today, `Reversión de pago: ${current.label}`, "cost_installment_payment_reversal", id, lines);
  }
}

// Factura del freelancer/proveedor (PDF+XML) como respaldo documental de la
// cuota de costo. No es obligatoria ni bloquea "marcar pagada" — el mecanismo
// de pago a proveedores no siempre corre en función del cobro al cliente, así
// que la factura puede llegar antes, después o nunca sin frenar el flujo.
export async function uploadCostInstallmentInvoice(
  installmentId: string,
  projectId: string,
  pdfFile?: File | null,
  xmlFile?: File | null,
): Promise<void> {
  const supabase = await createClient();
  const updates: { invoice_pdf_path?: string; invoice_xml_path?: string } = {};

  if (pdfFile && pdfFile.size > 0) {
    const path = `${projectId}/${installmentId}/factura.pdf`;
    const { error } = await supabase.storage
      .from("payments")
      .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    updates.invoice_pdf_path = path;
  }

  if (xmlFile && xmlFile.size > 0) {
    const path = `${projectId}/${installmentId}/factura.xml`;
    const { error } = await supabase.storage
      .from("payments")
      .upload(path, xmlFile, { contentType: "text/xml", upsert: true });
    if (error) throw error;
    updates.invoice_xml_path = path;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("project_cost_installments").update(updates).eq("id", installmentId);
    if (error) throw error;
  }
}

export async function linkFreelancerInvoiceToCostInstallment(
  installmentId: string,
  invoiceId: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_cost_installments")
    .update({ freelancer_invoice_id: invoiceId })
    .eq("id", installmentId);
  if (error) throw error;
}
