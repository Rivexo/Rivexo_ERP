"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  GanttChartSquare,
  History,
  LayoutGrid,
  Lightbulb,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "", label: "Overview", icon: LayoutGrid },
  { href: "/ideas", label: "IDEAS", icon: Lightbulb },
  { href: "/tasks", label: "Tareas", icon: ClipboardList },
  { href: "/gantt", label: "Gantt", icon: GanttChartSquare },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/swot", label: "SWOT", icon: LayoutGrid },
  { href: "/risks", label: "Riesgos", icon: ShieldAlert },
  { href: "/decisions", label: "Decisiones", icon: ScrollText },
  { href: "/history", label: "Historial", icon: History },
];

export function ProjectTabNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
