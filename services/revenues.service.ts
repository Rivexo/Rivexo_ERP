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
