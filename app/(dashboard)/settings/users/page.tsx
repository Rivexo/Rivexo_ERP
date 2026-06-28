import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { RoleSelect } from "@/components/settings/RoleSelect";
import { canManageSettings } from "@/lib/permissions";
import { getCurrentProfile, listProfiles } from "@/services/profiles.service";

export default async function UsersSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageSettings(profile.role)) redirect("/");

  const profiles = await listProfiles();

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestiona los roles de cada usuario de Rivexo OS" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.full_name}</TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>
                <RoleSelect profileId={p.id} currentRole={p.role} />
              </TableCell>
              <TableCell>
                <Badge variant={p.is_active ? "secondary" : "outline"}>{p.is_active ? "Activo" : "Inactivo"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
