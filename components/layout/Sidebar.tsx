"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Contact,
  FolderKanban,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  Tags,
  Users,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { canManageSettings, canViewCrm, canViewProjects, type UserRole } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function NavMenu({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
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
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden px-2 py-1.5">
          <img
            src="/logo/rivexo_icon.svg"
            alt="Rivexo"
            className="hidden size-5 shrink-0 group-data-[collapsible=icon]:block"
          />
          <img
            src="/logo/rivexo_horizontal.svg"
            alt="Rivexo"
            className="h-4 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
          />
          <span className="shrink-0 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
            OS
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMenu title="General" items={[{ href: "/", label: "Dashboard", icon: LayoutDashboard }]} />

        {canViewCrm(role) && <NavMenu title="CRM" items={crmItems} />}

        {canViewProjects(role) && (
          <NavMenu
            title="Proyectos"
            items={[
              { href: "/projects", label: "Proyectos", icon: FolderKanban },
              { href: "/projects/board", label: "Tablero IDEAS", icon: KanbanSquare },
            ]}
          />
        )}

        {canManageSettings(role) && <NavMenu title="Settings" items={settingsItems} />}
      </SidebarContent>

      <SidebarRail />
    </SidebarRoot>
  );
}
