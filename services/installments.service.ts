import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { InstallmentInput } from "@/lib/validations/installment";
import type { MilestoneExhibition } from "@/lib/validations/milestone-plan";

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

export async function listPendingInstallmentsByProject(projectId: string): Promise<Installment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_payment_installments")
    .select("*")
    .eq("project_id", projectId)
    .in("status", ["pending", "invoiced"])
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

// Suma el día al mes siguiente (o al mes +offset), con clamp al último día del
// mes destino cuando este es más corto (31-ene + 1 mes -> 28/29-feb, no 3-mar).
function addMonths(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const candidate = new Date(date.getFullYear(), targetMonth, date.getDate());
  if (candidate.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    return new Date(date.getFullYear(), targetMonth + 1, 0);
  }
  return candidate;
}

export type FinancingScheduleRow = {
  label: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  due_date: string;
};

export type FinancingSchedulePreview = {
  rows: FinancingScheduleRow[];
  total_with_interest: number;
  total_interest: number;
};

// Corrida de amortización francesa: cuota fija, con desglose capital/interés
// por período. El enganche (si existe) se descuenta del principal financiado
// y no genera interés; la primera mensualidad cae un mes después del enganche
// (mismo día, con clamp de fin de mes).
export function buildFinancingSchedule(params: {
  budgetSold: number;
  downPayment: number;
  termMonths: number;
  interestRateAnnual: number;
  startDate: Date;
}): FinancingSchedulePreview {
  const { budgetSold, downPayment, termMonths, interestRateAnnual, startDate } = params;
  const principal = budgetSold - downPayment;
  const r = interestRateAnnual / 12;
  const n = termMonths;
  const pmt = Math.round(calcPmt(principal, r, n) * 100) / 100;

  const rows: FinancingScheduleRow[] = [];

  if (downPayment > 0) {
    rows.push({
      label: "Enganche",
      amount: downPayment,
      principal_amount: downPayment,
      interest_amount: 0,
      due_date: startDate.toISOString().slice(0, 10),
    });
  }

  let balance = principal;
  for (let i = 0; i < n; i++) {
    const dueDate = addMonths(startDate, downPayment > 0 ? i + 1 : i);
    const interest = Math.round(balance * r * 100) / 100;
    let capital = Math.round((pmt - interest) * 100) / 100;
    let amount = pmt;
    if (i === n - 1) {
      // Ajuste de redondeo en la última cuota para que el saldo cierre en 0.
      capital = balance;
      amount = Math.round((capital + interest) * 100) / 100;
    }
    balance = Math.round((balance - capital) * 100) / 100;
    rows.push({
      label: `Mes ${i + 1} / ${n}`,
      amount,
      principal_amount: capital,
      interest_amount: interest,
      due_date: dueDate.toISOString().slice(0, 10),
    });
  }

  const total_interest = Math.round(rows.reduce((s, r) => s + r.interest_amount, 0) * 100) / 100;
  const total_with_interest = Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;

  return { rows, total_with_interest, total_interest };
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

  const startDate = fin.credit_start_date ? new Date(`${fin.credit_start_date}T00:00:00`) : new Date();
  const schedule = buildFinancingSchedule({
    budgetSold: fin.budget_sold,
    downPayment: fin.down_payment ?? 0,
    termMonths: fin.financing_term_months,
    interestRateAnnual: fin.interest_rate_annual ?? 0,
    startDate,
  });

  const rows = schedule.rows.map((row) => ({
    deal_id: dealId,
    project_id: projectId,
    label: row.label,
    amount: row.amount,
    principal_amount: row.principal_amount,
    interest_amount: row.interest_amount,
    due_date: row.due_date,
    status: "pending" as const,
  }));

  const { error } = await supabase.from("deal_payment_installments").insert(rows);
  if (error) throw error;
}

// Genera el mecanismo de pagos (exhibiciones con % y fecha, ej. 60/20/20). El
// monto de cada exhibición se calcula sobre budget_sold; la última exhibición
// absorbe el redondeo para que la suma cierre exacto.
export async function generateMilestoneSchedule(
  projectId: string,
  dealId: string,
  exhibitions: MilestoneExhibition[],
): Promise<void> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("deal_payment_installments")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  if (countError) throw countError;
  if (count && count > 0) throw new Error("Ya existe un calendario de pagos. Elimínalo antes de regenerar.");

  const { data: fin, error: finError } = await supabase
    .from("project_financials")
    .select("budget_sold")
    .eq("project_id", projectId)
    .single();
  if (finError) throw finError;

  let allocated = 0;
  const rows = exhibitions.map((ex, i) => {
    let amount = Math.round(((ex.percentage / 100) * fin.budget_sold) * 100) / 100;
    if (i === exhibitions.length - 1) {
      amount = Math.round((fin.budget_sold - allocated) * 100) / 100;
    } else {
      allocated = Math.round((allocated + amount) * 100) / 100;
    }
    return {
      deal_id: dealId,
      project_id: projectId,
      label: ex.label,
      amount,
      percentage: ex.percentage,
      due_date: ex.due_date,
      status: "pending" as const,
    };
  });

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
    .select("id, deal_id, project_id, label, amount, due_date, status, deal:deals(name, stage:pipeline_stages(is_won), account:accounts(name))")
    .in("status", ["pending", "invoiced"])
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  type Row = {
    id: string;
    deal_id: string;
    project_id: string | null;
    label: string;
    amount: number;
    due_date: string | null;
    deal: { name: string; stage: { is_won: boolean } | null; account: { name: string } | null } | null;
  };
  // Una cuota con project_id ya viene de un proyecto convertido, lo cual exige
  // is_won=true (ver convert_deal_to_project). No depender solo del stage del
  // deal, que puede haber cambiado o no traer el flag por un join incompleto.
  return (data as unknown as Row[])
    .filter((row) => row.project_id != null || row.deal?.stage?.is_won === true)
    .map((row) => ({
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
