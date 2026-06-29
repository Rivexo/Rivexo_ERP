import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { getAccountsReceivable } from "@/services/installments.service";

export type ChartAccount = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
export type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];
export type JournalLine = Database["public"]["Tables"]["journal_lines"]["Row"];

export type JournalEntryWithLines = JournalEntry & {
  lines: (JournalLine & { account: ChartAccount })[];
};

export type JournalLineInput = { accountCode: string; debit?: number; credit?: number };

export async function listChartOfAccounts(): Promise<ChartAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("chart_of_accounts").select("*").order("code");
  if (error) throw error;
  return data;
}

// Helper reutilizado por todos los posteos automaticos (revenues, variable_expenses,
// freelancer_invoices, costos fijos del mes, cobros de soporte) y por el asiento manual.
// Las lineas siempre deben balancear (cargos = abonos); el trigger de journal_lines lo
// garantiza incluso si esta funcion tuviera un bug.
export async function postJournalEntry(
  entryDate: string,
  description: string,
  sourceType: string,
  sourceId: string | null,
  lines: JournalLineInput[],
): Promise<string> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: accounts, error: accountsError } = await supabase.from("chart_of_accounts").select("id, code");
  if (accountsError) throw accountsError;
  const accountMap = new Map(accounts.map((a) => [a.code, a.id]));

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      entry_date: entryDate,
      description,
      source_type: sourceType,
      source_id: sourceId,
      created_by: userData.user?.id,
    })
    .select("id")
    .single();
  if (entryError) throw entryError;

  const rows = lines.map((line) => {
    const accountId = accountMap.get(line.accountCode);
    if (!accountId) throw new Error(`Cuenta contable "${line.accountCode}" no encontrada`);
    return { journal_entry_id: entry.id, account_id: accountId, debit: line.debit ?? 0, credit: line.credit ?? 0 };
  });

  const { error: linesError } = await supabase.from("journal_lines").insert(rows);
  if (linesError) throw linesError;

  return entry.id;
}

export async function listJournalEntries(): Promise<JournalEntryWithLines[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*, lines:journal_lines(*, account:chart_of_accounts(*))")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as JournalEntryWithLines[];
}

async function entryIdsInRange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startDate: string | null,
  endDate: string,
): Promise<string[]> {
  let query = supabase.from("journal_entries").select("id").lte("entry_date", endDate);
  if (startDate) query = query.gte("entry_date", startDate);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((e) => e.id);
}

export type IncomeStatementLine = { code: string; name: string; type: "revenue" | "expense"; amount: number };
export type IncomeStatement = {
  lines: IncomeStatementLine[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
};

export async function getIncomeStatement(startDate: string, endDate: string): Promise<IncomeStatement> {
  const supabase = await createClient();
  const entryIds = await entryIdsInRange(supabase, startDate, endDate);
  if (entryIds.length === 0) return { lines: [], totalRevenue: 0, totalExpense: 0, netIncome: 0 };

  const { data, error } = await supabase
    .from("journal_lines")
    .select("debit, credit, account:chart_of_accounts(code, name, type)")
    .in("journal_entry_id", entryIds);
  if (error) throw error;

  const byAccount = new Map<string, IncomeStatementLine>();
  for (const line of data as unknown as { debit: number; credit: number; account: ChartAccount }[]) {
    if (line.account.type !== "revenue" && line.account.type !== "expense") continue;
    const existing = byAccount.get(line.account.code) ?? {
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      amount: 0,
    };
    existing.amount += line.account.type === "revenue" ? line.credit - line.debit : line.debit - line.credit;
    byAccount.set(line.account.code, existing);
  }

  const lines = [...byAccount.values()].sort((a, b) => a.code.localeCompare(b.code));
  const totalRevenue = lines.filter((l) => l.type === "revenue").reduce((s, l) => s + l.amount, 0);
  const totalExpense = lines.filter((l) => l.type === "expense").reduce((s, l) => s + l.amount, 0);
  return { lines, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense };
}

export type BalanceSheet = {
  cash: number;
  accountsReceivable: number;
  accountsPayable: number;
  retainedEarnings: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
};

// Activo (Caja + CxC) = Pasivo (CxP) + Capital (Resultados Acumulados + CxC) -- la identidad
// de doble registro (Caja = CxP + Resultados Acumulados) se mantiene intacta; CxC se suma
// igual en ambos lados (activo y como renglon de capital), asi que cuadra siempre exacto.
// No hay activos fijos todavia, asi que Caja y CxC son los unicos activos del negocio.
export async function getBalanceSheet(asOfDate: string): Promise<BalanceSheet> {
  const supabase = await createClient();
  const entryIds = await entryIdsInRange(supabase, null, asOfDate);

  const receivables = await getAccountsReceivable();
  const accountsReceivable = receivables.reduce((sum, r) => sum + r.amount, 0);

  if (entryIds.length === 0) {
    return {
      cash: 0,
      accountsReceivable,
      accountsPayable: 0,
      retainedEarnings: 0,
      totalAssets: accountsReceivable,
      totalLiabilities: 0,
      totalEquity: accountsReceivable,
    };
  }

  const { data, error } = await supabase
    .from("journal_lines")
    .select("debit, credit, account:chart_of_accounts(code, type)")
    .in("journal_entry_id", entryIds);
  if (error) throw error;

  let cash = 0;
  let accountsPayable = 0;
  let revenueTotal = 0;
  let expenseTotal = 0;
  for (const line of data as unknown as { debit: number; credit: number; account: { code: string; type: string } }[]) {
    if (line.account.code === "1100") cash += line.debit - line.credit;
    else if (line.account.code === "2100") accountsPayable += line.credit - line.debit;
    else if (line.account.type === "revenue") revenueTotal += line.credit - line.debit;
    else if (line.account.type === "expense") expenseTotal += line.debit - line.credit;
  }

  const retainedEarnings = revenueTotal - expenseTotal;
  return {
    cash,
    accountsReceivable,
    accountsPayable,
    retainedEarnings,
    totalAssets: cash + accountsReceivable,
    totalLiabilities: accountsPayable,
    totalEquity: retainedEarnings + accountsReceivable,
  };
}

export type CashFlowCategory = { code: string; name: string; amount: number };
export type CashFlowStatement = {
  inflows: CashFlowCategory[];
  outflows: CashFlowCategory[];
  netOperating: number;
  openingCash: number;
  closingCash: number;
};

export async function getCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowStatement> {
  const supabase = await createClient();

  const dayBefore = new Date(`${startDate}T00:00:00`);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const opening = await getBalanceSheet(dayBefore.toISOString().slice(0, 10));

  const entryIds = await entryIdsInRange(supabase, startDate, endDate);
  if (entryIds.length === 0) {
    return { inflows: [], outflows: [], netOperating: 0, openingCash: opening.cash, closingCash: opening.cash };
  }

  const { data, error } = await supabase
    .from("journal_lines")
    .select("journal_entry_id, debit, credit, account:chart_of_accounts(code, name)")
    .in("journal_entry_id", entryIds);
  if (error) throw error;

  type Line = { journal_entry_id: string; debit: number; credit: number; account: { code: string; name: string } };
  const byEntry = new Map<string, Line[]>();
  for (const line of data as unknown as Line[]) {
    const arr = byEntry.get(line.journal_entry_id) ?? [];
    arr.push(line);
    byEntry.set(line.journal_entry_id, arr);
  }

  const categories = new Map<string, CashFlowCategory>();
  let netOperating = 0;

  for (const entryLines of byEntry.values()) {
    const cashLine = entryLines.find((l) => l.account.code === "1100");
    if (!cashLine) continue;

    const cashDelta = cashLine.debit - cashLine.credit;
    netOperating += cashDelta;

    const otherLines = entryLines.filter((l) => l.account.code !== "1100");
    // Asientos automaticos siempre son 2 lineas (caja + 1 cuenta); para un asiento manual
    // con mas lineas, se agrupa en "Otros movimientos" para no duplicar el monto.
    const categoryKey = otherLines.length === 1 ? otherLines[0].account.code : "OTROS";
    const categoryName = otherLines.length === 1 ? otherLines[0].account.name : "Otros movimientos";
    const existing = categories.get(categoryKey) ?? { code: categoryKey, name: categoryName, amount: 0 };
    existing.amount += cashDelta;
    categories.set(categoryKey, existing);
  }

  const inflows = [...categories.values()].filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
  const outflows = [...categories.values()]
    .filter((c) => c.amount < 0)
    .map((c) => ({ ...c, amount: -c.amount }))
    .sort((a, b) => b.amount - a.amount);

  return { inflows, outflows, netOperating, openingCash: opening.cash, closingCash: opening.cash + netOperating };
}
