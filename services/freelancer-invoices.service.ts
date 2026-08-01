import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { FreelancerInvoiceInput } from "@/lib/validations/freelancer-invoice";
import { postJournalEntry } from "@/services/accounting.service";
import { calcIvaBreakdown } from "@/lib/iva";

export type FreelancerInvoice = Database["public"]["Tables"]["freelancer_invoices"]["Row"];

export type FreelancerInvoiceWithRelations = FreelancerInvoice & {
  project: { id: string; name: string } | null;
};

export async function listFreelancerInvoices(): Promise<FreelancerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freelancer_invoices")
    .select("*, project:projects(id, name)")
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return data as unknown as FreelancerInvoiceWithRelations[];
}

export async function listFreelancerInvoicesByProject(projectId: string): Promise<FreelancerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freelancer_invoices")
    .select("*, project:projects(id, name)")
    .eq("project_id", projectId)
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return data as unknown as FreelancerInvoiceWithRelations[];
}

export async function createFreelancerInvoice(input: FreelancerInvoiceInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("freelancer_invoices").insert(input).select("id").single();
  if (error) throw error;

  await postJournalEntry(input.invoice_date, `Factura de freelancer: ${input.freelancer_name}`, "freelancer_invoice", data.id, [
    { accountCode: "5500", debit: input.amount },
    { accountCode: "2100", credit: input.amount },
  ]);

  return data.id;
}

export async function updateFreelancerInvoice(id: string, input: FreelancerInvoiceInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("freelancer_invoices").update(input).eq("id", id);
  if (error) throw error;
}

export async function updateFreelancerInvoiceStatus(id: string, status: "pending" | "paid"): Promise<void> {
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("freelancer_invoices")
    .select("amount, status, freelancer_name")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;

  const { error } = await supabase
    .from("freelancer_invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;

  if (current.status === status) return;

  const today = new Date().toISOString().slice(0, 10);
  if (status === "paid") {
    await postJournalEntry(today, `Pago de factura de freelancer: ${current.freelancer_name}`, "freelancer_invoice_payment", id, [
      { accountCode: "2100", debit: current.amount },
      { accountCode: "1100", credit: current.amount },
    ]);
  } else {
    await postJournalEntry(today, `Reversión de pago: ${current.freelancer_name}`, "freelancer_invoice_payment_reversal", id, [
      { accountCode: "1100", debit: current.amount },
      { accountCode: "2100", credit: current.amount },
    ]);
  }
}

export async function deleteFreelancerInvoice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("freelancer_invoices").delete().eq("id", id);
  if (error) throw error;
}

export type AccountsPayableRow = {
  id: string;
  source: "freelancer_invoice" | "cost_installment";
  description: string;
  project_name: string;
  amount: number;
  gross_amount: number;
  due_date: string | null;
  is_overdue: boolean;
};

export async function getAccountsPayable(): Promise<AccountsPayableRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [invoicesResult, costResult] = await Promise.all([
    supabase
      .from("freelancer_invoices")
      .select("id, freelancer_name, amount, due_date, project:projects(name, financials:project_financials(iva_rate))")
      .eq("status", "pending"),
    supabase
      .from("project_cost_installments")
      .select(
        "id, label, amount, due_date, freelancer_invoice_id, project:projects(name, financials:project_financials(iva_rate))",
      )
      .eq("status", "pending"),
  ]);

  if (invoicesResult.error) throw invoicesResult.error;
  if (costResult.error) throw costResult.error;

  type ProjectRef = { name: string; financials: { iva_rate: number } | null };
  type InvoiceRow = { id: string; freelancer_name: string; amount: number; due_date: string | null; project: ProjectRef | null };
  type CostRow = {
    id: string;
    label: string;
    amount: number;
    due_date: string | null;
    freelancer_invoice_id: string | null;
    project: ProjectRef | null;
  };

  // Una cuota de costo ligada a una factura de freelancer representa el mismo
  // monto pendiente; si se cuentan las dos se duplica en CxP.
  const linkedInvoiceIds = new Set(
    (costResult.data as unknown as CostRow[])
      .map((row) => row.freelancer_invoice_id)
      .filter((id): id is string => id != null),
  );

  const invoiceRows: AccountsPayableRow[] = (invoicesResult.data as unknown as InvoiceRow[])
    .filter((row) => !linkedInvoiceIds.has(row.id))
    .map((row) => ({
    id: row.id,
    source: "freelancer_invoice",
    description: row.freelancer_name,
    project_name: row.project?.name ?? "—",
    amount: row.amount,
    gross_amount: calcIvaBreakdown(row.amount, row.project?.financials?.iva_rate ?? 0.16).total,
    due_date: row.due_date,
    is_overdue: !!row.due_date && row.due_date < today,
  }));

  const costRows: AccountsPayableRow[] = (costResult.data as unknown as CostRow[]).map((row) => ({
    id: row.id,
    source: "cost_installment",
    description: row.label,
    project_name: row.project?.name ?? "—",
    amount: row.amount,
    gross_amount: calcIvaBreakdown(row.amount, row.project?.financials?.iva_rate ?? 0.16).total,
    due_date: row.due_date,
    is_overdue: !!row.due_date && row.due_date < today,
  }));

  const all = [...invoiceRows, ...costRows];
  all.sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
  });
  return all;
}
