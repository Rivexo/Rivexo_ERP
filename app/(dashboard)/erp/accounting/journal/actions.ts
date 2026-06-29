"use server";

import { revalidatePath } from "next/cache";
import { journalEntrySchema, type JournalEntryInput } from "@/lib/validations/journal-entry";
import { postJournalEntry } from "@/services/accounting.service";
import { postMonthlyFixedCosts } from "@/services/fixed-costs.service";

export async function createManualJournalEntryAction(input: JournalEntryInput): Promise<void> {
  const parsed = journalEntrySchema.parse(input);
  await postJournalEntry(
    parsed.entry_date,
    parsed.description,
    "manual",
    null,
    parsed.lines.map((l) => ({ accountCode: l.accountCode, debit: l.debit, credit: l.credit })),
  );
  revalidatePath("/erp/accounting/journal");
}

export async function postMonthlyFixedCostsAction(): Promise<number> {
  const created = await postMonthlyFixedCosts();
  revalidatePath("/erp/accounting/journal");
  return created;
}
