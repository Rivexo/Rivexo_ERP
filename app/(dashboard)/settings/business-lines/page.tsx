import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { NewBusinessLineForm } from "@/components/settings/NewBusinessLineForm";
import { ToggleActiveButton } from "@/components/settings/ToggleActiveButton";
import { canManageSettings } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { toggleBusinessLineActiveAction } from "./actions";

export default async function BusinessLinesSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageSettings(profile.role)) redirect("/");

  const lines = await listBusinessLines();

  return (
    <div className="space-y-6">
      <PageHeader title="Líneas de Negocio" description="Deployments, Soporte, Mini Apps / Notion, etc." />
      <NewBusinessLineForm />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">{line.name}</TableCell>
              <TableCell>
                <Badge variant={line.is_active ? "secondary" : "outline"}>{line.is_active ? "Activa" : "Inactiva"}</Badge>
              </TableCell>
              <TableCell>
                <ToggleActiveButton
                  isActive={line.is_active}
                  onToggle={toggleBusinessLineActiveAction.bind(null, line.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
