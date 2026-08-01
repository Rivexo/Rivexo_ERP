import { createClient } from "@/lib/supabase/server";
import { calcIvaBreakdown } from "@/lib/iva";

export type ProjectFinancialSummaryRow = {
  id: string;
  name: string;
  account_name: string;
  current_phase_code: string | null;
  current_phase_name: string | null;
  budget_sold_with_iva: number;
  collected: number;
  receivable: number;
  overdue: number;
};

// Portal financiero: una fila por proyecto con lo que ya se cobró, lo que
// queda por cobrar y cuánto de eso está vencido. El total del deal (con IVA)
// se lee en vivo del deal (fuente única, ver deal_financials_view) en vez de
// depender de que existan cuotas o de un budget_sold editable en el ERP;
// "receivable" es siempre total - cobrado, no la suma de cuotas pendientes.
export async function listProjectsFinancialSummary(): Promise<ProjectFinancialSummaryRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, name,
      account:accounts(name),
      financials:project_financials(budget_sold, iva_rate),
      deal:deals(price, iva_rate, deal_financials(estimated_direct_cost)),
      project_ideas_phases(status, phase:ideas_phases(code, name, order_index)),
      installments:deal_payment_installments(amount, status, due_date)`,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    name: string;
    account: { name: string } | null;
    financials: { budget_sold: number; iva_rate: number } | null;
    deal: { price: number; iva_rate: number; deal_financials: { estimated_direct_cost: number } | null } | null;
    project_ideas_phases: { status: string; phase: { code: string; name: string; order_index: number } }[];
    installments: { amount: number; status: string; due_date: string | null }[];
  };

  return (data as unknown as Row[]).map((row) => {
    const sortedPhases = [...row.project_ideas_phases].sort((a, b) => a.phase.order_index - b.phase.order_index);
    const currentPhase = sortedPhases.find((p) => p.status !== "done") ?? sortedPhases[sortedPhases.length - 1];

    const ivaRate = row.deal?.iva_rate ?? row.financials?.iva_rate ?? 0.16;
    const priceNet = row.deal?.price ?? row.financials?.budget_sold ?? 0;
    const budgetSoldWithIva = calcIvaBreakdown(priceNet, ivaRate).total;

    const collected = row.installments
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);
    const receivable = Math.round((budgetSoldWithIva - collected) * 100) / 100;
    const overdue = row.installments
      .filter((i) => i.status !== "paid" && !!i.due_date && i.due_date < today)
      .reduce((s, i) => s + calcIvaBreakdown(i.amount, ivaRate).total, 0);

    return {
      id: row.id,
      name: row.name,
      account_name: row.account?.name ?? "—",
      current_phase_code: currentPhase?.phase.code ?? null,
      current_phase_name: currentPhase?.phase.name ?? null,
      budget_sold_with_iva: budgetSoldWithIva,
      collected,
      receivable,
      overdue,
    };
  });
}

export type CashflowComparisonRow = {
  month: string;
  collected: number;
  paid: number;
  net: number;
};

// Compara, mes a mes, lo que se cobra al cliente contra lo que se paga al
// proveedor (freelancer/empleado) del mismo proyecto — el escenario "cobramos
// 80% de anticipo pero pagamos 50% al freelancer ese mes".
export async function getProjectCashflowComparison(projectId: string): Promise<CashflowComparisonRow[]> {
  const supabase = await createClient();

  const [{ data: collectionRows, error: collectionError }, { data: costRows, error: costError }] =
    await Promise.all([
      supabase
        .from("deal_payment_installments")
        .select("amount, due_date")
        .eq("project_id", projectId)
        .not("due_date", "is", null),
      supabase
        .from("project_cost_installments")
        .select("amount, due_date")
        .eq("project_id", projectId)
        .not("due_date", "is", null),
    ]);
  if (collectionError) throw collectionError;
  if (costError) throw costError;

  const byMonth = new Map<string, { collected: number; paid: number }>();

  for (const row of collectionRows ?? []) {
    const month = row.due_date!.slice(0, 7);
    const entry = byMonth.get(month) ?? { collected: 0, paid: 0 };
    entry.collected += row.amount;
    byMonth.set(month, entry);
  }
  for (const row of costRows ?? []) {
    const month = row.due_date!.slice(0, 7);
    const entry = byMonth.get(month) ?? { collected: 0, paid: 0 };
    entry.paid += row.amount;
    byMonth.set(month, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { collected, paid }]) => ({
      month,
      collected: Math.round(collected * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      net: Math.round((collected - paid) * 100) / 100,
    }));
}
