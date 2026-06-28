import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { canManageCrm } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listAccounts } from "@/services/accounts.service";

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospecto",
  customer: "Cliente",
  inactive: "Inactivo",
};

export default async function AccountsPage() {
  const [accounts, profile] = await Promise.all([listAccounts(), getCurrentProfile()]);
  const canManage = profile ? canManageCrm(profile.role) : false;

  return (
    <div>
      <PageHeader
        title="Cuentas"
        description="Empresas con las que Rivexo tiene relación comercial"
        action={
          canManage && (
            <Button nativeButton={false} render={<Link href="/crm/accounts/new" />}>
              <Plus className="size-4" /> Nueva cuenta
            </Button>
          )
        }
      />

      {accounts.length === 0 ? (
        <EmptyState title="Aún no hay cuentas" description="Crea la primera cuenta para empezar." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Industria</TableHead>
              <TableHead>Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Link href={`/crm/accounts/${account.id}`} className="font-medium hover:underline">
                    {account.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[account.status]}</Badge>
                </TableCell>
                <TableCell>{account.industry ?? "—"}</TableCell>
                <TableCell>{account.owner?.full_name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
