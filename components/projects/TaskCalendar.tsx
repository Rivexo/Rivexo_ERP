"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "react-big-calendar";
import dateFnsLocalizerFactory from "react-big-calendar/lib/localizers/date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { TaskWithRelations } from "@/lib/task-tree";

const localizer = dateFnsLocalizerFactory({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
});

const STATUS_COLOR: Record<string, string> = {
  todo: "#9aa0ae",
  in_progress: "#3D5AE8",
  in_review: "#7B45C2",
  done: "#22c55e",
  blocked: "#ef4444",
};

export function TaskCalendar({ tasks }: { tasks: TaskWithRelations[] }) {
  const router = useRouter();

  const events = useMemo(
    () =>
      tasks
        .filter((t) => t.due_date)
        .map((t) => {
          const due = new Date(`${t.due_date}T00:00:00`);
          const start = t.start_date ? new Date(`${t.start_date}T00:00:00`) : due;
          return { id: t.id, title: t.title, start, end: due, resource: t };
        }),
    [tasks],
  );

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Ninguna tarea tiene fecha límite todavía.</p>;
  }

  return (
    <div className="h-[650px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="es"
        views={["month", "week", "agenda"]}
        eventPropGetter={(event) => ({
          style: { backgroundColor: STATUS_COLOR[event.resource.status], borderColor: "transparent" },
        })}
        onSelectEvent={(event) => router.push(`/projects/${event.resource.project_id}/tasks`)}
        messages={{
          next: "Sig.",
          previous: "Ant.",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          agenda: "Agenda",
          noEventsInRange: "Sin tareas en este rango.",
        }}
      />
    </div>
  );
}
