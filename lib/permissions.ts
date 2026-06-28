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
