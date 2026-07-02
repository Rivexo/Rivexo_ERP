import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { RevenueInput } from "@/lib/validations/revenue";
import { postJournalEntry } from "@/services/accounting.service";

export type Revenue = Database["public"]["Tables"]["revenues"]["Row"];
export type DealPaymentInstallment = Database["public"]["Tables"]["deal_payment_installments"]["Row"];

export type RevenueWithRelations = Revenue & {
  project: { id: string; name: string } | null;
};

export async function listRevenues(): Promise<RevenueWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("revenues")
    .select("*, project:projects(id, name)")
    .order("received_at", { ascending: false });
  if (error) throw error;
  return data as unknown as RevenueWithRelations[];
}

export type InstallmentWithProject = DealPaymentInstallment & { project_id: string };

// Trae todas las cuotas con el proyecto al que pertenecen (via deal_id), para que
// el formulario de ingresos filtre en el cliente segun el proyecto seleccionado
// sin necesitar un round-trip extra al servidor.
export async function listAllInstallmentsWithProject(): Promise<InstallmentWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_payment_installments")
    .select("*, deal:deals(project:projects(id))")
    .order("due_date");
  if (error) throw error;

  type Row = DealPaymentInstallment & { deal: { project: { id: string } | null } | null };
  return (data as unknown as Row[])
    .filter((row) => row.deal?.project?.id)
    .map(({ deal, ...rest }) => ({ ...rest, project_id: deal!.project!.id }));
}

export type ForecastRow = {
  id: string;
  deal_id: string;
  deal_name: string;
  account_name: string;
  label: string;
  amount: number;
  due_date: string | null;
  is_overdue: boolean;
  status: "pending" | "invoiced" | "paid";
};

export type ForecastSummary = {
  total_committed: number;
  due_this_month: number;
  overdue: number;
  rows: ForecastRow[];
};

export async function getRevenueForecast(): Promise<ForecastSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_payment_installments")
    .select("id, deal_id, label, amount, due_date, status, deal:deals(name, account:accounts(name), stage:pipeline_stages(is_won))")
    .in("status", ["pending", "invoiced"])
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const thisMonthStart = today.slice(0, 7) + "-01";
  const nextMonthStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    return d.toISOString().slice(0, 10);
  })();

  type Raw = {
    id: string;
    deal_id: string;
    label: string;
    amount: number;
    due_date: string | null;
    status: string;
    deal: { name: string; account: { name: string } | null; stage: { is_won: boolean } | null } | null;
  };

  const wonRows = (data as unknown as Raw[])
    .filter((r) => r.deal?.stage?.is_won === true)
    .map((r) => ({
      id: r.id,
      deal_id: r.deal_id,
      deal_name: r.deal?.name ?? "—",
      account_name: r.deal?.account?.name ?? "—",
      label: r.label,
      amount: r.amount,
      due_date: r.due_date,
      is_overdue: !!r.due_date && r.due_date < today,
      status: r.status as ForecastRow["status"],
    }));

  const total_committed = wonRows.reduce((s, r) => s + r.amount, 0);
  const due_this_month = wonRows
    .filter((r) => r.due_date && r.due_date >= thisMonthStart && r.due_date < nextMonthStart)
    .reduce((s, r) => s + r.amount, 0);
  const overdue = wonRows
    .filter((r) => r.is_overdue)
    .reduce((s, r) => s + r.amount, 0);

  return { total_committed, due_this_month, overdue, rows: wonRows };
}

export async function createRevenue(input: RevenueInput): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("revenues").insert(input).select("id").single();
  if (error) throw error;

  if (input.related_installment_id) {
    const { error: installmentError } = await supabase
      .from("deal_payment_installments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", input.related_installment_id);
    if (installmentError) throw installmentError;
  }

  const revenueAccountCode = input.kind === "interest" ? "4300" : "4100";
  await postJournalEntry(input.received_at, `Cobro de ingreso (${input.kind})`, "revenue", data.id, [
    { accountCode: "1100", debit: input.amount },
    { accountCode: revenueAccountCode, credit: input.amount },
  ]);
}

export async function updateRevenue(id: string, input: RevenueInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("revenues").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteRevenue(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("revenues").delete().eq("id", id);
  if (error) throw error;
}
