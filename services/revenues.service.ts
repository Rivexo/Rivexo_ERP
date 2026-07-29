import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { RevenueInput } from "@/lib/validations/revenue";
import { postJournalEntry, type JournalLineInput } from "@/services/accounting.service";
import { getCurrentPhaseByProject } from "@/services/ideas.service";

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
  source: "project" | "support";
};

export type ForecastSummary = {
  total_committed: number;
  due_this_month: number;
  overdue: number;
  rows: ForecastRow[];
};

export async function getRevenueForecast(): Promise<ForecastSummary> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [installmentsResult, subscriptionsResult] = await Promise.all([
    supabase
      .from("deal_payment_installments")
      .select("id, deal_id, project_id, label, amount, due_date, status, deal:deals(name, account:accounts(name), stage:pipeline_stages(is_won))")
      .in("status", ["pending", "invoiced"])
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("monthly_support_subscriptions")
      .select("project_id")
      .eq("status", "active")
      .lte("start_date", today),
  ]);

  if (installmentsResult.error) throw installmentsResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;

  const subscribedProjectIds = (subscriptionsResult.data ?? [])
    .filter((s) => s.project_id)
    .map((s) => s.project_id as string);

  // El soporte de un proyecto solo cuenta como forecast de "soporte" cuando el
  // proyecto ya está en la etapa S (Soporte) de IDEAS; antes de eso, aunque
  // exista la suscripción, sigue siendo forecast de proyecto (deployment).
  const currentPhaseByProject = await getCurrentPhaseByProject(subscribedProjectIds);
  const supportProjectIds = new Set(
    subscribedProjectIds.filter((id) => currentPhaseByProject.get(id) === "S"),
  );

  const thisMonthStart = today.slice(0, 7) + "-01";
  const nextMonthStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    return d.toISOString().slice(0, 10);
  })();

  type Raw = {
    id: string;
    deal_id: string;
    project_id: string | null;
    label: string;
    amount: number;
    due_date: string | null;
    status: string;
    deal: { name: string; account: { name: string } | null; stage: { is_won: boolean } | null } | null;
  };

  const wonRows = (installmentsResult.data as unknown as Raw[])
    .filter((r) => r.project_id != null || r.deal?.stage?.is_won === true)
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
      source: (r.project_id && supportProjectIds.has(r.project_id) ? "support" : "project") as ForecastRow["source"],
    }));

  const total_committed = wonRows.reduce((s, r) => s + r.amount, 0);
  const due_this_month = wonRows
    .filter((r) => r.due_date && r.due_date >= thisMonthStart && r.due_date < nextMonthStart)
    .reduce((s, r) => s + r.amount, 0);
  const overdue = wonRows.filter((r) => r.is_overdue).reduce((s, r) => s + r.amount, 0);

  return { total_committed, due_this_month, overdue, rows: wonRows };
}

export type ExpenseForecastRow = {
  id: string;
  project_id: string | null;
  project_name: string;
  label: string;
  amount: number;
  due_date: string | null;
  is_overdue: boolean;
  source: "cost_installment" | "freelancer_invoice";
};

export async function getExpenseForecast(): Promise<ExpenseForecastRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: costRows, error: costError }, { data: freelancerRows, error: freelancerError }] =
    await Promise.all([
      supabase
        .from("project_cost_installments")
        .select("id, project_id, label, amount, due_date, project:projects(name)")
        .eq("status", "pending")
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("freelancer_invoices")
        .select("id, project_id, freelancer_name, amount, due_date, project:projects(name)")
        .eq("status", "pending")
        .order("due_date", { ascending: true, nullsFirst: false }),
    ]);
  if (costError) throw costError;
  if (freelancerError) throw freelancerError;

  type CostRaw = {
    id: string;
    project_id: string;
    label: string;
    amount: number;
    due_date: string | null;
    project: { name: string } | null;
  };
  type FreelancerRaw = {
    id: string;
    project_id: string;
    freelancer_name: string;
    amount: number;
    due_date: string | null;
    project: { name: string } | null;
  };

  const costResults: ExpenseForecastRow[] = (costRows as unknown as CostRaw[]).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.project?.name ?? "—",
    label: r.label,
    amount: r.amount,
    due_date: r.due_date,
    is_overdue: !!r.due_date && r.due_date < today,
    source: "cost_installment",
  }));

  const freelancerResults: ExpenseForecastRow[] = (freelancerRows as unknown as FreelancerRaw[]).map((r) => ({
    id: r.id,
    project_id: r.project_id,
    project_name: r.project?.name ?? "—",
    label: `Factura freelancer — ${r.freelancer_name}`,
    amount: r.amount,
    due_date: r.due_date,
    is_overdue: !!r.due_date && r.due_date < today,
    source: "freelancer_invoice",
  }));

  return [...costResults, ...freelancerResults].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

export async function createRevenue(input: RevenueInput): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("revenues").insert(input).select("id").single();
  if (error) throw error;

  let installmentBreakdown: { principal_amount: number | null; interest_amount: number | null } | null = null;
  if (input.related_installment_id) {
    const { data: installment, error: installmentFetchError } = await supabase
      .from("deal_payment_installments")
      .select("principal_amount, interest_amount")
      .eq("id", input.related_installment_id)
      .single();
    if (installmentFetchError) throw installmentFetchError;
    installmentBreakdown = installment;

    const { error: installmentError } = await supabase
      .from("deal_payment_installments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", input.related_installment_id);
    if (installmentError) throw installmentError;
  }

  // Si la cuota cobrada trae desglose de amortización (financiamiento), el
  // asiento se divide en capital (4100) e interés (4300); si no, se postea
  // completo a la cuenta que indique `kind`.
  if (installmentBreakdown?.interest_amount) {
    const principalPart = installmentBreakdown.principal_amount ?? input.amount - installmentBreakdown.interest_amount;
    const lines: JournalLineInput[] = [{ accountCode: "1100", debit: input.amount }];
    if (principalPart > 0) lines.push({ accountCode: "4100", credit: principalPart });
    lines.push({ accountCode: "4300", credit: installmentBreakdown.interest_amount });
    await postJournalEntry(input.received_at, "Cobro de ingreso (financiamiento: capital + interés)", "revenue", data.id, lines);
  } else {
    const revenueAccountCode = input.kind === "interest" ? "4300" : "4100";
    await postJournalEntry(input.received_at, `Cobro de ingreso (${input.kind})`, "revenue", data.id, [
      { accountCode: "1100", debit: input.amount },
      { accountCode: revenueAccountCode, credit: input.amount },
    ]);
  }
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
