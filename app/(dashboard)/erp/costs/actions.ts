"use server";

import { revalidatePath } from "next/cache";
import { fixedCostSchema, type FixedCostInput } from "@/lib/validations/fixed-cost";
import { variableExpenseSchema, type VariableExpenseInput } from "@/lib/validations/variable-expense";
import { createFixedCost, deleteFixedCost, updateFixedCost } from "@/services/fixed-costs.service";
import {
  createVariableExpense,
  deleteVariableExpense,
  updateVariableExpense,
  uploadExpenseConciliation,
} from "@/services/variable-expenses.service";
import { createEmployee, updateEmployeeActive, accrueMonthlyPayroll } from "@/services/employees.service";

export async function createFixedCostAction(input: FixedCostInput): Promise<void> {
  const parsed = fixedCostSchema.parse(input);
  await createFixedCost(parsed);
  revalidatePath("/erp/costs");
}

export async function updateFixedCostAction(id: string, input: FixedCostInput): Promise<void> {
  const parsed = fixedCostSchema.parse(input);
  await updateFixedCost(id, parsed);
  revalidatePath("/erp/costs");
}

export async function deleteFixedCostAction(id: string): Promise<void> {
  await deleteFixedCost(id);
  revalidatePath("/erp/costs");
}

export async function createVariableExpenseAction(input: VariableExpenseInput): Promise<void> {
  const parsed = variableExpenseSchema.parse(input);
  await createVariableExpense(parsed);
  revalidatePath("/erp/costs");
}

export async function updateVariableExpenseAction(id: string, input: VariableExpenseInput): Promise<void> {
  const parsed = variableExpenseSchema.parse(input);
  await updateVariableExpense(id, parsed);
  revalidatePath("/erp/costs");
}

export async function deleteVariableExpenseAction(id: string): Promise<void> {
  await deleteVariableExpense(id);
  revalidatePath("/erp/costs");
}

export async function uploadExpenseConciliationAction(id: string, formData: FormData): Promise<void> {
  const pdf = formData.get("pdf");
  const xml = formData.get("xml");
  await uploadExpenseConciliation(
    id,
    pdf instanceof File ? pdf : null,
    xml instanceof File ? xml : null,
  );
  revalidatePath("/erp/costs");
}

export async function createEmployeeAction(input: { full_name: string; monthly_salary: number }): Promise<void> {
  await createEmployee(input);
  revalidatePath("/erp/costs");
}

export async function updateEmployeeActiveAction(id: string, active: boolean): Promise<void> {
  await updateEmployeeActive(id, active);
  revalidatePath("/erp/costs");
}

export async function accruePayrollAction(): Promise<number> {
  const created = await accrueMonthlyPayroll(new Date().toISOString().slice(0, 10));
  revalidatePath("/erp/costs");
  revalidatePath("/erp/accounting/balance-sheet");
  revalidatePath("/erp/accounting/journal");
  return created;
}
