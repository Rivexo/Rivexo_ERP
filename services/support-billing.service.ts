import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { postJournalEntry } from "@/services/accounting.service";

export type SupportBillingRecord = Database["public"]["Tables"]["support_billing_records"]["Row"];

export type SupportBillingRecordWithRelations = SupportBillingRecord & {
  subscription: {
    id: string;
    payment_method: Database["public"]["Enums"]["support_payment_method"];
    account: { id: string; name: string } | null;
  } | null;
};

export async function listSupportBillingRecords(): Promise<SupportBillingRecordWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_billing_records")
    .select("*, subscription:monthly_support_subscriptions(id, payment_method, account:accounts(id, name))")
    .order("period", { ascending: false });
  if (error) throw error;
  return data as unknown as SupportBillingRecordWithRelations[];
}

// Crea el cobro esperado del mes en curso para cada suscripcion activa que aun no
// lo tenga (idempotente via el unique (subscription_id, period) de la tabla).
export async function generateMonthlyBillingRecords(): Promise<number> {
  const supabase = await createClient();

  const { data: subscriptions, error: subsError } = await supabase
    .from("monthly_support_subscriptions")
    .select("id, amount, billing_day")
    .eq("status", "active");
  if (subsError) throw subsError;
  if (!subscriptions.length) return 0;

  const today = new Date();
  const period = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const rows = subscriptions.map((sub) => {
    const dueDay = Math.min(sub.billing_day, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay).toISOString().slice(0, 10);
    return { subscription_id: sub.id, period, amount: sub.amount, due_date: dueDate };
  });

  const { data: inserted, error } = await supabase
    .from("support_billing_records")
    .upsert(rows, { onConflict: "subscription_id,period", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return inserted?.length ?? 0;
}

export async function markSupportBillingPaid(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("support_billing_records")
    .select("amount, status")
    .eq("id", id)
    .single();
  if (recordError) throw recordError;
  if (record.status === "paid") return;

  const { error } = await supabase
    .from("support_billing_records")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  await postJournalEntry(today, "Cobro de soporte mensual", "support_billing", id, [
    { accountCode: "1100", debit: record.amount },
    { accountCode: "4200", credit: record.amount },
  ]);
}
