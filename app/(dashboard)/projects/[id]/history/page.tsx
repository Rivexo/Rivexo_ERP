import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getProject } from "@/services/projects.service";
import { listActivity } from "@/services/activity.service";

export default async function ProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const activity = await listActivity("project", id);

  return (
    <div className="space-y-3">
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
      ) : (
        activity.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div>
                <p className="text-sm">{entry.description}</p>
                <p className="text-xs text-muted-foreground">{entry.actor?.full_name ?? "Sistema"}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString("es-MX")}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
