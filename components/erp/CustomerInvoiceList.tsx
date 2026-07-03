"use client";

import { useRouter } from "next/navigation";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerInvoiceDialog, UploadInvoiceFilesDialog } from "@/components/erp/CustomerInvoiceDialog";
import { formatCurrency } from "@/lib/utils";
import type { CustomerInvoiceWithRelations, InvoiceStatus } from "@/services/customer-invoices.service";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  parcialmente_pagada: "Parcial",
  pagada: "Pagada",
  cancelada: "Cancelada",
  vencida: "Vencida",
};

const STATUS_VARIANT: Record<InvoiceStatus, "outline" | "secondary" | "destructive"> = {
  borrador: "outline",
  emitida: "secondary",
  parcialmente_pagada: "secondary",
  pagada: "secondary",
  cancelada: "destructive",
  vencida: "destructive",
};

const EDITABLE_STATUSES: InvoiceStatus[] = ["borrador", "emitida", "cancelada", "vencida"];

export function CustomerInvoiceList({
  invoices,
  canEdit,
  showProject,
  onCreate,
  onUpload,
  onStatusChange,
  onDelete,
}: {
  invoices: CustomerInvoiceWithRelations[];
  canEdit: boolean;
  showProject?: boolean;
  onCreate?: (formData: FormData) => Promise<void>;
  onUpload: (invoiceId: string, formData: FormData) => Promise<void>;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => Promise<void>;
  onDelete: (invoiceId: string) => Promise<void>;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  async function handleStatus(id: string, status: string | null) {
    if (!status) return;
    await onStatusChange(id, status as InvoiceStatus);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && onCreate && (
        <CustomerInvoiceDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Nueva factura
            </Button>
          }
          onCreate={onCreate}
        />
      )}

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin facturas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showProject && <TableHead>Proyecto</TableHead>}
                <TableHead>Folio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Archivos</TableHead>
                {canEdit && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const isOverdue =
                  inv.status !== "pagada" &&
                  inv.status !== "cancelada" &&
                  !!inv.due_at &&
                  inv.due_at < today;
                const folioDisplay = [inv.serie, inv.folio].filter(Boolean).join("-") || "—";

                return (
                  <TableRow key={inv.id}>
                    {showProject && (
                      <TableCell className="text-sm">{inv.project?.name ?? "—"}</TableCell>
                    )}
                    <TableCell className="font-medium">{folioDisplay}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(inv.subtotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(inv.iva_amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(`${inv.issued_at}T00:00:00`).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.due_at ? (
                        <span className={isOverdue ? "text-destructive font-medium" : undefined}>
                          {new Date(`${inv.due_at}T00:00:00`).toLocaleDateString("es-MX")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={inv.status}
                          onValueChange={(v) => handleStatus(inv.id, v)}
                        >
                          <SelectTrigger className="h-7 w-auto gap-1 border-0 px-2 py-0 text-xs shadow-none">
                            <SelectValue>
                              {() => (
                                <Badge variant={STATUS_VARIANT[inv.status]}>
                                  {STATUS_LABEL[inv.status]}
                                </Badge>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {EDITABLE_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={STATUS_VARIANT[inv.status]}>
                          {STATUS_LABEL[inv.status]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {inv.pdf_url ? (
                          <a href={inv.pdf_url} target="_blank" rel="noreferrer" title="Descargar PDF">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <FileText className="size-3.5 text-red-500" />
                            </Button>
                          </a>
                        ) : null}
                        {inv.xml_url ? (
                          <a href={inv.xml_url} target="_blank" rel="noreferrer" title="Descargar XML">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Download className="size-3.5 text-blue-500" />
                            </Button>
                          </a>
                        ) : null}
                        {canEdit && (!inv.pdf_url || !inv.xml_url) && (
                          <UploadInvoiceFilesDialog
                            invoiceId={inv.id}
                            onUpload={onUpload}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Subir archivos">
                                <Upload className="size-3.5" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Eliminar factura"
                          onClick={() => handleDelete(inv.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
