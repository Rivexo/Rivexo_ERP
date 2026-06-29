import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { FreelancerInvoiceInput } from "@/lib/validations/freelancer-invoice";
import { postJournalEntry } from "@/services/accounting.service";

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
  freelancer_name: string;
  project_name: string;
  amount: number;
  due_date: string | null;
  is_overdue: boolean;
};

export async function getAccountsPayable(): Promise<AccountsPayableRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freelancer_invoices")
    .select("id, freelancer_name, amount, due_date, project:projects(name)")
    .eq("status", "pending")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  type Row = { id: string; freelancer_name: string; amount: number; due_date: string | null; project: { name: string } | null };
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    freelancer_name: row.freelancer_name,
    project_name: row.project?.name ?? "—",
    amount: row.amount,
    due_date: row.due_date,
    is_overdue: !!row.due_date && row.due_date < today,
  }));
}
