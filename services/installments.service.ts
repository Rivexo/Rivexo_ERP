import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { InstallmentInput } from "@/lib/validations/installment";

export type Installment = Database["public"]["Tables"]["deal_payment_installments"]["Row"];

export async function listInstallmentsByDeal(dealId: string): Promise<Installment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_payment_installments")
    .select("*")
    .eq("deal_id", dealId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function createInstallment(dealId: string, input: InstallmentInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deal_payment_installments").insert({ deal_id: dealId, ...input });
  if (error) throw error;
}

export async function updateInstallment(id: string, input: InstallmentInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deal_payment_installments").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteInstallment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deal_payment_installments").delete().eq("id", id);
  if (error) throw error;
}

// Genera el calendario mensual de un deal financiado (financed_total / financing_term_months
// cuotas iguales). Idempotente: si el deal ya tiene cuotas, no genera duplicados.
export async function generateFinancingSchedule(dealId: string): Promise<void> {
  const supabase = await createClient();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("is_financed, financed_total, financing_term_months")
    .eq("id", dealId)
    .single();
  if (dealError) throw dealError;
  if (!deal.is_financed || !deal.financed_total || !deal.financing_term_months) {
    throw new Error("Este deal no tiene datos de financiamiento completos");
  }

  const { count, error: countError } = await supabase
    .from("deal_payment_installments")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  if (countError) throw countError;
  if (count && count > 0) throw new Error("Este deal ya tiene un calendario de pagos");

  const monthlyAmount = Math.round((deal.financed_total / deal.financing_term_months) * 100) / 100;
  const today = new Date();
  const rows = Array.from({ length: deal.financing_term_months }, (_, i) => {
    const dueDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
    return {
      deal_id: dealId,
      label: `Financiamiento - Mes ${i + 1}`,
      amount: monthlyAmount,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "pending" as const,
    };
  });

  const { error } = await supabase.from("deal_payment_installments").insert(rows);
  if (error) throw error;
}

export async function createInstallmentForProject(
  projectId: string,
  dealId: string,
  input: InstallmentInput,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deal_payment_installments")
    .insert({ deal_id: dealId, project_id: projectId, ...input });
  if (error) throw error;
}

export async function deleteAllInstallmentsByDeal(dealId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deal_payment_installments").delete().eq("deal_id", dealId);
  if (error) throw error;
}

function calcPmt(principal: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0) return principal / n;
  const factor = Math.pow(1 + monthlyRate, n);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export async function generateProjectFinancingSchedule(projectId: string, dealId: string): Promise<void> {
  const supabase = await createClient();

  const { data: fin, error: finError } = await supabase
    .from("project_financials")
    .select("budget_sold, financing_term_months, interest_rate_annual, credit_start_date, down_payment")
    .eq("project_id", projectId)
    .single();
  if (finError) throw finError;
  if (!fin.financing_term_months) throw new Error("El proyecto no tiene plazo configurado");

  const { count, error: countError } = await supabase
    .from("deal_payment_installments")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  if (countError) throw countError;
  if (count && count > 0) throw new Error("Ya existe un calendario de pagos. Elimínalo antes de regenerar.");

  const downPayment = fin.down_payment ?? 0;
  const principal = fin.budget_sold - downPayment;
  const r = (fin.interest_rate_annual ?? 0) / 12;
  const n = fin.financing_term_months;
  const pmt = Math.round(calcPmt(principal, r, n) * 100) / 100;

  const startDate = fin.credit_start_date ? new Date(`${fin.credit_start_date}T00:00:00`) : new Date();
  const rows: {
    deal_id: string;
    project_id: string;
    label: string;
    amount: number;
    due_date: string;
    status: "pending";
  }[] = [];

  if (downPayment > 0) {
    rows.push({
      deal_id: dealId,
      project_id: projectId,
      label: "Enganche",
      amount: downPayment,
      due_date: startDate.toISOString().slice(0, 10),
      status: "pending",
    });
  }

  for (let i = 0; i < n; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + (downPayment > 0 ? i + 1 : i), startDate.getDate());
    rows.push({
      deal_id: dealId,
      project_id: projectId,
      label: `Mes ${i + 1} / ${n}`,
      amount: pmt,
      due_date: d.toISOString().slice(0, 10),
      status: "pending",
    });
  }

  const { error } = await supabase.from("deal_payment_installments").insert(rows);
  if (error) throw error;
}

export async function linkInvoiceToInstallment(installmentId: string, invoiceId: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deal_payment_installments")
    .update({ invoice_id: invoiceId })
    .eq("id", installmentId);
  if (error) throw error;
}

export type AccountsReceivableRow = {
  id: string;
  deal_id: string;
  deal_name: string;
  account_name: string;
  label: string;
  amount: number;
  due_date: string | null;
  is_overdue: boolean;
};

export async function getAccountsReceivable(): Promise<AccountsReceivableRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_payment_installments")
    .select("id, deal_id, label, amount, due_date, status, deal:deals(name, account:accounts(name))")
    .in("status", ["pending", "invoiced"])
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  type Row = {
    id: string;
    deal_id: string;
    label: string;
    amount: number;
    due_date: string | null;
    deal: { name: string; account: { name: string } | null } | null;
  };
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    deal_id: row.deal_id,
    deal_name: row.deal?.name ?? "—",
    account_name: row.deal?.account?.name ?? "—",
    label: row.label,
    amount: row.amount,
    due_date: row.due_date,
    is_overdue: !!row.due_date && row.due_date < today,
  }));
}
