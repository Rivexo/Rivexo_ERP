import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { postJournalEntry } from "@/services/accounting.service";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];

export async function listEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("employees").select("*").order("full_name");
  if (error) throw error;
  return data;
}

export async function createEmployee(input: {
  full_name: string;
  monthly_salary: number;
  payroll_day?: number;
  profile_id?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert(input);
  if (error) throw error;
}

export async function updateEmployeeActive(id: string, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ active }).eq("id", id);
  if (error) throw error;
}

// Devenga la nómina mensual de los empleados activos: crea payroll_accruals +
// asiento (débito 5600 Sueldos y Salarios, crédito 2300 Nómina por Pagar), que
// es lo que hace que el pasivo aparezca en el balance general. Idempotente por
// (employee_id, period) via el unique constraint de la tabla.
export async function accrueMonthlyPayroll(period: string): Promise<number> {
  const supabase = await createClient();
  const periodMonth = period.slice(0, 7) + "-01";

  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, full_name, monthly_salary")
    .eq("active", true);
  if (employeesError) throw employeesError;
  if (!employees.length) return 0;

  const { data: existing, error: existingError } = await supabase
    .from("payroll_accruals")
    .select("employee_id")
    .eq("period", periodMonth)
    .in("employee_id", employees.map((e) => e.id));
  if (existingError) throw existingError;
  const alreadyAccrued = new Set(existing.map((e) => e.employee_id));

  const pending = employees.filter((e) => !alreadyAccrued.has(e.id));
  for (const employee of pending) {
    const journalEntryId = await postJournalEntry(
      periodMonth,
      `Devengo de nómina: ${employee.full_name}`,
      "payroll_accrual",
      employee.id,
      [
        { accountCode: "5600", debit: employee.monthly_salary },
        { accountCode: "2300", credit: employee.monthly_salary },
      ],
    );

    const { error: insertError } = await supabase.from("payroll_accruals").insert({
      employee_id: employee.id,
      period: periodMonth,
      amount: employee.monthly_salary,
      journal_entry_id: journalEntryId,
    });
    if (insertError) throw insertError;
  }

  return pending.length;
}

export type ProjectPayrollCost = { project_id: string; amount: number };

// Prorratea el sueldo mensual de cada empleado entre los proyectos/soporte a
// los que dedica tiempo (time_allocations.allocation_pct), para absorber el
// costo de personal fijo en el costo de proyecto según cuánto tiempo le dedica.
export async function getPayrollCostByProject(period: string): Promise<ProjectPayrollCost[]> {
  const supabase = await createClient();
  const periodMonth = period.slice(0, 7) + "-01";

  const { data: allocations, error } = await supabase
    .from("time_allocations")
    .select("project_id, allocation_pct, employee:employees(monthly_salary), effective_from, effective_to")
    .not("project_id", "is", null)
    .not("allocation_pct", "is", null)
    .lte("effective_from", periodMonth)
    .or(`effective_to.is.null,effective_to.gte.${periodMonth}`);
  if (error) throw error;

  type Row = {
    project_id: string;
    allocation_pct: number;
    employee: { monthly_salary: number } | null;
  };

  const byProject = new Map<string, number>();
  for (const row of allocations as unknown as Row[]) {
    if (!row.employee) continue;
    const cost = Math.round(((row.allocation_pct / 100) * row.employee.monthly_salary) * 100) / 100;
    byProject.set(row.project_id, Math.round(((byProject.get(row.project_id) ?? 0) + cost) * 100) / 100);
  }

  return Array.from(byProject.entries()).map(([project_id, amount]) => ({ project_id, amount }));
}

export type PayablesForecastRow = {
  month: string;
  freelancer_amount: number;
  employee_amount: number;
};

// Forecast de CxP basado únicamente en costo directo ya programado
// (project_cost_installments no pagadas), sin incluir freelancer_invoices
// sueltas — ese es el "costo directo del freelancer o absorbido para
// empleado" que pidió el usuario, no cualquier factura de proveedor.
export async function getPayablesForecast(monthsAhead: number): Promise<PayablesForecastRow[]> {
  const supabase = await createClient();
  const today = new Date();
  const cutoff = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 1).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("project_cost_installments")
    .select("amount, due_date, payee_type")
    .neq("status", "paid")
    .not("due_date", "is", null)
    .lt("due_date", cutoff);
  if (error) throw error;

  const byMonth = new Map<string, { freelancer: number; employee: number }>();
  for (const row of data ?? []) {
    const month = row.due_date!.slice(0, 7);
    const entry = byMonth.get(month) ?? { freelancer: 0, employee: 0 };
    if (row.payee_type === "employee") entry.employee += row.amount;
    else entry.freelancer += row.amount;
    byMonth.set(month, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { freelancer, employee }]) => ({
      month,
      freelancer_amount: Math.round(freelancer * 100) / 100,
      employee_amount: Math.round(employee * 100) / 100,
    }));
}
