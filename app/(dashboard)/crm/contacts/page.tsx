import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { listContacts } from "@/services/contacts.service";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return (
    <div>
      <PageHeader title="Contactos" description="Personas de contacto en todas las cuentas" />

      {contacts.length === 0 ? (
        <EmptyState title="Aún no hay contactos" description="Agrega contactos desde el detalle de una cuenta." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">
                  {contact.full_name}
                  {contact.is_primary && (
                    <Badge variant="secondary" className="ml-2">
                      Principal
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/crm/accounts/${contact.account_id}`} className="hover:underline">
                    {contact.account?.name ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>{contact.job_title ?? "—"}</TableCell>
                <TableCell>{contact.email ?? "—"}</TableCell>
                <TableCell>{contact.phone ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
