import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { VariableExpenseInput } from "@/lib/validations/variable-expense";
import { postJournalEntry } from "@/services/accounting.service";

export type VariableExpense = Database["public"]["Tables"]["variable_expenses"]["Row"];

export type VariableExpenseWithRelations = VariableExpense & {
  category: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

export async function listVariableExpenses(): Promise<VariableExpenseWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("variable_expenses")
    .select("*, category:expense_categories(id, name), project:projects(id, name)")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data as unknown as VariableExpenseWithRelations[];
}

export async function createVariableExpense(input: VariableExpenseInput): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("variable_expenses").insert(input).select("id").single();
  if (error) throw error;

  // Se asume pagado en efectivo al momento de registrarse (igual que hoy).
  await postJournalEntry(input.expense_date, `Gasto variable: ${input.description}`, "variable_expense", data.id, [
    { accountCode: "5300", debit: input.amount },
    { accountCode: "1100", credit: input.amount },
  ]);
}

export async function updateVariableExpense(id: string, input: VariableExpenseInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("variable_expenses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteVariableExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("variable_expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadExpenseConciliation(
  expenseId: string,
  pdfFile?: File | null,
  xmlFile?: File | null,
): Promise<void> {
  const supabase = await createClient();
  const updates: {
    vendor_invoice_pdf_path?: string;
    vendor_invoice_xml_path?: string;
    vendor_invoice_ref?: string;
    conciliation_status: "conciliado";
  } = { conciliation_status: "conciliado" };

  if (pdfFile && pdfFile.size > 0) {
    const path = `expenses/${expenseId}/comprobante.pdf`;
    const { error } = await supabase.storage
      .from("cost-invoices")
      .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
    if (error) throw error;
    updates.vendor_invoice_pdf_path = path;
  }

  if (xmlFile && xmlFile.size > 0) {
    const path = `expenses/${expenseId}/comprobante.xml`;
    const { error } = await supabase.storage
      .from("cost-invoices")
      .upload(path, xmlFile, { contentType: "text/xml", upsert: true });
    if (error) throw error;
    updates.vendor_invoice_xml_path = path;
  }

  const { error } = await supabase.from("variable_expenses").update(updates).eq("id", expenseId);
  if (error) throw error;
}
