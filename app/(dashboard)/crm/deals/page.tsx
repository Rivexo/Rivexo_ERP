import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { canManageCrm } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { listDeals } from "@/services/deals.service";

export default async function DealsPage() {
  const [deals, profile] = await Promise.all([listDeals(), getCurrentProfile()]);
  const canManage = profile ? canManageCrm(profile.role) : false;

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Oportunidades comerciales"
        action={
          canManage && (
            <Button nativeButton={false} render={<Link href="/crm/deals/new" />}>
              <Plus className="size-4" /> Nuevo deal
            </Button>
          )
        }
      />

      {deals.length === 0 ? (
        <EmptyState title="Aún no hay deals" description="Crea el primer deal para empezar." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell>
                  <Link href={`/crm/deals/${deal.id}`} className="font-medium hover:underline">
                    {deal.name}
                  </Link>
                </TableCell>
                <TableCell>{deal.account?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: deal.stage?.color ?? undefined }} className="text-white">
                    {deal.stage?.name}
                  </Badge>
                </TableCell>
                <TableCell>{deal.owner?.full_name ?? "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(deal.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
