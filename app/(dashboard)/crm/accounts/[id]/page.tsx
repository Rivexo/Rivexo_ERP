import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContactDialog } from "@/components/crm/ContactDialog";
import { ContractsPanel } from "@/components/shared/ContractsPanel";
import { canManageCrm } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { getCurrentProfile } from "@/services/profiles.service";
import { getAccount } from "@/services/accounts.service";
import { listContactsByAccount } from "@/services/contacts.service";
import { listDealsByAccount } from "@/services/deals.service";
import { listContractsByAccount } from "@/services/files.service";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, profile] = await Promise.all([getAccount(id), getCurrentProfile()]);
  if (!account) notFound();

  const [contacts, deals, contracts] = await Promise.all([
    listContactsByAccount(id),
    listDealsByAccount(id),
    listContractsByAccount(id),
  ]);
  const canManage = profile ? canManageCrm(profile.role) : false;

  return (
    <div>
      <PageHeader
        title={account.name}
        description={account.industry ?? undefined}
        action={
          canManage && (
            <Button variant="outline" nativeButton={false} render={<Link href={`/crm/accounts/${id}/edit`} />}>
              <Pencil className="size-4" /> Editar
            </Button>
          )
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contactos ({contacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
              <Field label="Razón social" value={account.legal_name} />
              <Field label="RFC" value={account.tax_id} />
              <Field label="Tamaño" value={account.company_size} />
              <Field label="Estatus" value={<Badge variant="outline">{account.status}</Badge>} />
              <Field label="Dirección" value={account.address} />
              <Field label="Estado" value={account.state} />
              <Field label="País" value={account.country} />
              <Field label="Sitio web" value={account.website} />
              <Field label="Fuente del lead" value={account.lead_source} />
              <div className="sm:col-span-2">
                <Field label="Notas" value={account.notes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 space-y-4">
          {canManage && (
            <ContactDialog
              accountId={id}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> Agregar contacto
                </Button>
              }
            />
          )}
          {contacts.length === 0 ? (
            <EmptyState title="Sin contactos" description="Agrega el primer contacto de esta cuenta." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="space-y-1 pt-6">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{contact.full_name}</p>
                      {contact.is_primary && <Badge variant="secondary">Principal</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                    <p className="text-sm">{contact.email}</p>
                    <p className="text-sm">{contact.phone}</p>
                    {canManage && (
                      <ContactDialog
                        accountId={id}
                        contact={contact}
                        trigger={
                          <Button size="sm" variant="ghost" className="mt-2">
                            Editar
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-4 space-y-4">
          {canManage && (
            <Button size="sm" nativeButton={false} render={<Link href={`/crm/deals/new?account_id=${id}`} />}>
              <Plus className="size-4" /> Nuevo deal
            </Button>
          )}
          {deals.length === 0 ? (
            <EmptyState title="Sin deals" description="Esta cuenta aún no tiene oportunidades." />
          ) : (
            <div className="space-y-2">
              {deals.map((deal) => (
                <Link key={deal.id} href={`/crm/deals/${deal.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between pt-6">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">{deal.stage?.name}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(deal.price)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <ContractsPanel contracts={contracts} readOnly />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}
