import { buildTaskTree, type TaskNode, type TaskWithRelations } from "@/lib/task-tree";

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-muted-foreground/40",
  in_progress: "bg-[#3D5AE8]",
  in_review: "bg-[#7B45C2]",
  done: "bg-[#22c55e]",
  blocked: "bg-[#ef4444]",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function flatten(nodes: TaskNode[], depth = 0): { node: TaskNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)]);
}

export function GanttChart({ tasks }: { tasks: TaskWithRelations[] }) {
  const withDates = tasks.filter((t) => t.start_date || t.due_date);

  if (withDates.length === 0) {
    return <p className="text-sm text-muted-foreground">Ninguna tarea tiene fechas todavía.</p>;
  }

  const starts = withDates.map((t) => toDate(t.start_date ?? t.due_date)!.getTime());
  const ends = withDates.map((t) => toDate(t.due_date ?? t.start_date)!.getTime());
  const rangeStart = Math.min(...starts);
  const rangeEnd = Math.max(...ends, rangeStart + DAY_MS);
  const totalDays = Math.max((rangeEnd - rangeStart) / DAY_MS, 1);

  const rows = flatten(buildTaskTree(withDates));

  function offsetPct(date: Date) {
    return ((date.getTime() - rangeStart) / DAY_MS / totalDays) * 100;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{new Date(rangeStart).toLocaleDateString("es-MX")}</span>
        <span>{new Date(rangeEnd).toLocaleDateString("es-MX")}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ node, depth }) => {
          const start = toDate(node.start_date ?? node.due_date)!;
          const end = toDate(node.due_date ?? node.start_date)!;
          const left = offsetPct(start);
          const width = Math.max(offsetPct(end) - left, 1.5);

          return (
            <div key={node.id} className="flex items-center gap-3">
              <div className="w-48 shrink-0 truncate text-sm" style={{ paddingLeft: depth * 16 }}>
                {node.title}
              </div>
              <div className="relative h-6 flex-1 rounded bg-muted">
                <div
                  className={`absolute h-full rounded ${STATUS_COLOR[node.status]}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${node.title} (${node.start_date ?? "?"} → ${node.due_date ?? "?"})`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
