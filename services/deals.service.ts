import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { DealInput } from "@/lib/validations/deal";

export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type DealFinancials = Database["public"]["Views"]["deal_financials_view"]["Row"];
export type PipelineSummary = Database["public"]["Views"]["v_pipeline_summary"]["Row"];

export type DealWithRelations = Deal & {
  account: { id: string; name: string } | null;
  primary_contact: { id: string; full_name: string } | null;
  business_line: { id: string; name: string } | null;
  owner: { id: string; full_name: string } | null;
  stage: { id: string; name: string; color: string | null; is_won: boolean; is_lost: boolean } | null;
};

const DEAL_RELATIONS_SELECT = `
  *,
  account:accounts(id, name),
  primary_contact:contacts!deals_primary_contact_id_fkey(id, full_name),
  business_line:business_lines(id, name),
  owner:profiles!deals_owner_id_fkey(id, full_name),
  stage:pipeline_stages(id, name, color, is_won, is_lost)
`;

export async function listDeals(): Promise<DealWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_RELATIONS_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function listDealsByAccount(accountId: string): Promise<DealWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_RELATIONS_SELECT)
    .eq("account_id", accountId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as DealWithRelations[];
}

export async function getDeal(id: string): Promise<DealWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_RELATIONS_SELECT)
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as unknown as DealWithRelations;
}

// Returns null (not an error) when the caller's role can't see deal_financials (e.g. sales) — RLS
// makes the underlying join return zero rows rather than throwing.
export async function getDealFinancials(dealId: string): Promise<DealFinancials | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("deal_financials_view").select("*").eq("deal_id", dealId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPipelineSummary(): Promise<PipelineSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_pipeline_summary").select("*").single();
  if (error) throw error;
  return data;
}

export async function createDeal(input: DealInput, createdBy: string): Promise<Deal> {
  const supabase = await createClient();
  const { estimated_direct_cost, ...dealFields } = input;

  const { data, error } = await supabase
    .from("deals")
    .insert({ ...dealFields, created_by: createdBy })
    .select()
    .single();
  if (error) throw error;

  if (estimated_direct_cost !== null && estimated_direct_cost !== undefined) {
    const { error: financialsError } = await supabase
      .from("deal_financials")
      .insert({ deal_id: data.id, estimated_direct_cost });
    if (financialsError) throw financialsError;
  }

  return data;
}

export async function updateDeal(id: string, input: DealInput): Promise<void> {
  const supabase = await createClient();
  const { estimated_direct_cost, ...dealFields } = input;

  const { error } = await supabase.from("deals").update(dealFields).eq("id", id);
  if (error) throw error;

  if (estimated_direct_cost !== null && estimated_direct_cost !== undefined) {
    const { error: financialsError } = await supabase
      .from("deal_financials")
      .upsert({ deal_id: id, estimated_direct_cost });
    if (financialsError) throw financialsError;
  }
}

export async function updateDealStage(
  dealId: string,
  stage: { id: string; is_won: boolean; is_lost: boolean },
  lostReason?: string,
): Promise<void> {
  const supabase = await createClient();
  const isClosed = stage.is_won || stage.is_lost;
  const { error } = await supabase
    .from("deals")
    .update({
      stage_id: stage.id,
      closed_at: isClosed ? new Date().toISOString() : null,
      lost_reason: stage.is_lost ? lostReason ?? null : null,
    })
    .eq("id", dealId);
  if (error) throw error;
}

export async function updateDealWonPayment(
  dealId: string,
  payment: import("@/lib/validations/deal").WonPaymentInput,
): Promise<void> {
  const supabase = await createClient();

  if (payment.modalidad === "contado") {
    const { error } = await supabase
      .from("deals")
      .update({ payment_method: payment.payment_method, is_financed: false, is_msi: false })
      .eq("id", dealId);
    if (error) throw error;

    const rows = payment.installments.map((inst) => ({
      deal_id: dealId,
      label: inst.label,
      due_date: inst.due_date ?? null,
      amount: inst.amount,
      status: "pending" as const,
    }));
    const { error: instError } = await supabase.from("deal_payment_installments").insert(rows);
    if (instError) throw instError;
  } else {
    const monthlyRate = payment.is_msi ? 0 : (payment.interest_rate ?? 0) / 100;
    const n = payment.financing_term_months;
    const P = payment.financed_total;

    const monthlyPayment =
      monthlyRate === 0
        ? Math.round((P / n) * 100) / 100
        : Math.round((P * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) * 100) / 100;

    const { error } = await supabase
      .from("deals")
      .update({
        is_financed: true,
        financed_total: P,
        financing_term_months: n,
        interest_rate: monthlyRate,
        is_msi: payment.is_msi,
      })
      .eq("id", dealId);
    if (error) throw error;

    const today = new Date();
    const rows = Array.from({ length: n }, (_, i) => {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
      return {
        deal_id: dealId,
        label: payment.is_msi ? `MSI - Mes ${i + 1}` : `Financiamiento - Mes ${i + 1}`,
        amount: monthlyPayment,
        due_date: dueDate.toISOString().slice(0, 10),
        status: "pending" as const,
      };
    });
    const { error: instError } = await supabase.from("deal_payment_installments").insert(rows);
    if (instError) throw instError;
  }
}

export async function softDeleteDeal(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
