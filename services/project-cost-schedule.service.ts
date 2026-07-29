import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { CostInstallmentInput } from "@/lib/validations/cost-installment";
import { postJournalEntry } from "@/services/accounting.service";

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

export async function updateCostInstallmentStatus(id: string, status: "pending" | "paid"): Promise<void> {
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("project_cost_installments")
    .select("amount, status, label, payee_type")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;

  const { error } = await supabase
    .from("project_cost_installments")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);
  if (error) throw error;

  if (current.status === status) return;

  const expenseAccountCode = current.payee_type === "employee" ? "5600" : "5500";
  const today = new Date().toISOString().slice(0, 10);
  if (status === "paid") {
    await postJournalEntry(today, `Pago a proveedor: ${current.label}`, "cost_installment_payment", id, [
      { accountCode: expenseAccountCode, debit: current.amount },
      { accountCode: "1100", credit: current.amount },
    ]);
  } else {
    await postJournalEntry(today, `Reversión de pago: ${current.label}`, "cost_installment_payment_reversal", id, [
      { accountCode: "1100", debit: current.amount },
      { accountCode: expenseAccountCode, credit: current.amount },
    ]);
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
