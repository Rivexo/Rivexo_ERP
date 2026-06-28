"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Contact,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canManageSettings, canViewCrm, type UserRole } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{title}</p>
      {items.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </div>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const crmItems: NavItem[] = [
    { href: "/crm/accounts", label: "Cuentas", icon: Building2 },
    { href: "/crm/contacts", label: "Contactos", icon: Contact },
    { href: "/crm/deals", label: "Deals", icon: Handshake },
    { href: "/crm/pipeline", label: "Pipeline", icon: KanbanSquare },
  ];

  const settingsItems: NavItem[] = [
    { href: "/settings/users", label: "Usuarios", icon: Users },
    { href: "/settings/pipeline-stages", label: "Etapas de Pipeline", icon: KanbanSquare },
    { href: "/settings/business-lines", label: "Líneas de Negocio", icon: Tags },
  ];

  return (
    <aside className="flex h-full w-64 flex-col gap-6 border-r bg-sidebar p-4">
      <div className="flex items-center gap-2 px-3 py-2">
        <img src="/logo/rivexo_horizontal.svg" alt="Rivexo" className="h-7 w-auto" />
        <span className="text-xs font-semibold text-muted-foreground">OS</span>
      </div>

      <NavSection title="General" items={[{ href: "/", label: "Dashboard", icon: LayoutDashboard }]} />

      {canViewCrm(role) && <NavSection title="CRM" items={crmItems} />}

      {canManageSettings(role) && <NavSection title="Settings" items={settingsItems} />}
    </aside>
  );
}
