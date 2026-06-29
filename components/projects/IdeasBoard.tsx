import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithCurrentPhase } from "@/services/projects.service";

const PHASES = [
  { code: "I", name: "Investigación" },
  { code: "D", name: "Diseño" },
  { code: "E", name: "Ejecución" },
  { code: "A", name: "Adopción" },
  { code: "S", name: "Soporte" },
] as const;

export function IdeasBoard({ projects }: { projects: ProjectWithCurrentPhase[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${PHASES.length}, minmax(200px, 1fr))` }}>
      {PHASES.map((phase) => {
        const phaseProjects = projects.filter((p) => p.current_phase_code === phase.code);
        return (
          <div key={phase.code} className="flex min-w-0 flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
            <div className="flex items-center justify-between gap-1">
              <Badge className="gap-1.5">
                <span className="font-mono font-bold">{phase.code}</span>
                {phase.name}
              </Badge>
              <span className="shrink-0 text-xs text-muted-foreground">{phaseProjects.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {phaseProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:bg-accent/50">
                    <CardContent className="space-y-1 p-2.5">
                      <p className="text-xs font-medium">{project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{project.account?.name}</p>
                      <p className="text-xs font-semibold">Progreso: {project.progress_pct}%</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {phaseProjects.length === 0 && (
                <p className="px-1 text-xs text-muted-foreground">Sin proyectos</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
