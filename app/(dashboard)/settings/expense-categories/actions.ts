"use server";

import { revalidatePath } from "next/cache";
import { expenseCategorySchema, type ExpenseCategoryInput } from "@/lib/validations/expense-category";
import { createExpenseCategory, updateExpenseCategory } from "@/services/expense-categories.service";

export async function createExpenseCategoryAction(input: ExpenseCategoryInput): Promise<void> {
  const parsed = expenseCategorySchema.parse(input);
  await createExpenseCategory(parsed);
  revalidatePath("/settings/expense-categories");
}

export async function toggleExpenseCategoryActiveAction(id: string, isActive: boolean): Promise<void> {
  await updateExpenseCategory(id, { is_active: isActive });
  revalidatePath("/settings/expense-categories");
}
