import type { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];

const ROLE_LABELS: Record<UserRole, string> = {
  founder: "Founder",
  partner: "Socio",
  project_manager: "Project Manager",
  sales: "Ventas",
  operations: "Operación",
  finance: "Finanzas",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function isAdminRole(role: UserRole): boolean {
  return role === "founder" || role === "partner";
}

// CRM operativo (cuentas/contactos/deals): admin y ventas administran, finanzas solo lee.
export function canViewCrm(role: UserRole): boolean {
  return isAdminRole(role) || role === "sales" || role === "finance";
}

export function canManageCrm(role: UserRole): boolean {
  return isAdminRole(role) || role === "sales";
}

// Costo directo, márgenes y utilidad de deals/proyectos: nunca visibles para Ventas.
export function canViewFinancials(role: UserRole): boolean {
  return isAdminRole(role) || role === "finance";
}

export function canManageSettings(role: UserRole): boolean {
  return isAdminRole(role);
}

// Proyectos, IDEAS, SWOT, riesgos, decisiones: admin total, PM sobre los suyos
// (RLS valida la asignación real); finanzas solo lectura. Ventas no entra aquí.
export function canViewProjects(role: UserRole): boolean {
  return isAdminRole(role) || role === "project_manager" || role === "finance" || role === "operations";
}

export function canManageProjects(role: UserRole): boolean {
  return isAdminRole(role) || role === "project_manager";
}

// Costo directo/presupuesto de proyectos: PM los ve (de sus proyectos) pero no los edita,
// igual que la política RLS de project_financials (select admin/finance/PM, write admin/finance).
export function canViewProjectFinancials(role: UserRole): boolean {
  return isAdminRole(role) || role === "finance" || role === "project_manager";
}

export function canManageProjectFinancials(role: UserRole): boolean {
  return isAdminRole(role) || role === "finance";
}

export function canConvertDealToProject(role: UserRole): boolean {
  return isAdminRole(role);
}
