"use client";

import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FreelancerInvoiceDialog } from "@/components/erp/FreelancerInvoiceDialog";
import { formatCurrency } from "@/lib/utils";
import type { FreelancerInvoiceWithRelations } from "@/services/freelancer-invoices.service";
import type { FileWithUploader } from "@/services/files.service";
import type { ProjectWithRelations } from "@/services/projects.service";

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", paid: "Pagada" };

export function FreelancerInvoiceList({
  invoices,
  files,
  fixedProjectId,
  projects,
  onCreate,
  onToggleStatus,
  onDelete,
}: {
  invoices: FreelancerInvoiceWithRelations[];
  files: Record<string, FileWithUploader | undefined>;
  fixedProjectId?: string;
  projects: ProjectWithRelations[];
  onCreate: (formData: FormData) => Promise<void>;
  onToggleStatus: (id: string, status: "pending" | "paid") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  async function handleToggle(id: string, current: string) {
    await onToggleStatus(id, current === "paid" ? "pending" : "paid");
    router.refresh();
  }

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <FreelancerInvoiceDialog
        fixedProjectId={fixedProjectId}
        projects={projects}
        onCreate={onCreate}
        trigger={
          <Button size="sm">
            <Plus className="size-4" /> Nueva factura
          </Button>
        }
      />

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin facturas de freelancers registradas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {!fixedProjectId && <TableHead>Proyecto</TableHead>}
              <TableHead>Freelancer</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const file = files[invoice.id];
              return (
                <TableRow key={invoice.id}>
                  {!fixedProjectId && <TableCell>{invoice.project?.name ?? "—"}</TableCell>}
                  <TableCell className="font-medium">{invoice.freelancer_name}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{new Date(`${invoice.invoice_date}T00:00:00`).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>
                    <button onClick={() => handleToggle(invoice.id, invoice.status)}>
                      <Badge variant={invoice.status === "paid" ? "secondary" : "outline"}>
                        {STATUS_LABELS[invoice.status]}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    {file?.url ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <FileText className="size-3.5" /> Ver
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label="Eliminar factura" onClick={() => handleDelete(invoice.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
