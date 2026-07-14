"use client";

import { useRouter } from "next/navigation";
import { Download, FileText, Link2Off, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerPaymentDialog, ReconcilePaymentDialog, UploadPaymentComplementDialog } from "@/components/erp/CustomerPaymentDialog";
import { formatCurrency } from "@/lib/utils";
import type { CustomerPaymentWithReconciliation, PendingInvoiceOption } from "@/services/customer-payments.service";

const METHOD_LABEL: Record<string, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
  cheque: "Cheque",
  otro: "Otro",
};

export function CustomerPaymentList({
  payments,
  pendingInvoices,
  projectId,
  canEdit,
  onCreate,
  onApply,
  onRemoveApplication,
  onDelete,
  onUploadComplement,
}: {
  payments: CustomerPaymentWithReconciliation[];
  pendingInvoices: PendingInvoiceOption[];
  projectId?: string;
  canEdit: boolean;
  onCreate: (formData: FormData) => Promise<void>;
  onApply: (paymentId: string, invoiceId: string, amountApplied: number) => Promise<void>;
  onRemoveApplication: (paymentId: string, invoiceId: string) => Promise<void>;
  onDelete: (paymentId: string) => Promise<void>;
  onUploadComplement?: (projectId: string, paymentId: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await onDelete(id);
    router.refresh();
  }

  async function handleRemoveApp(paymentId: string, invoiceId: string) {
    await onRemoveApplication(paymentId, invoiceId);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <CustomerPaymentDialog
          pendingInvoices={pendingInvoices}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Registrar pago
            </Button>
          }
          onCreate={onCreate}
        />
      )}

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Aplicado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Facturas aplicadas</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((pmt) => (
                <TableRow key={pmt.id}>
                  <TableCell className="text-sm">
                    {new Date(`${pmt.paid_at}T00:00:00`).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(pmt.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(pmt.total_applied)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pmt.remaining > 0 ? (
                      <span className="text-amber-600 font-medium">{formatCurrency(pmt.remaining)}</span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Aplicado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pmt.payment_method ? METHOD_LABEL[pmt.payment_method] ?? pmt.payment_method : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {pmt.bank_reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {pmt.applied_invoices.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sin aplicar</span>
                      ) : (
                        pmt.applied_invoices.map((ai) => (
                          <div key={ai.invoice_id} className="flex items-center gap-0.5">
                            <span className="text-xs rounded-full bg-muted px-2 py-0.5">
                              {ai.invoice_folio ?? "(s/f)"} {formatCurrency(ai.amount_applied)}
                            </span>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                title="Quitar aplicación"
                                onClick={() => handleRemoveApp(pmt.id, ai.invoice_id)}
                              >
                                <Link2Off className="size-3" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {pmt.receipt_url && (
                        <a href={pmt.receipt_url} target="_blank" rel="noreferrer" title="Comprobante de pago">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="size-3.5" />
                          </Button>
                        </a>
                      )}
                      {pmt.complement_pdf_url && (
                        <a href={pmt.complement_pdf_url} target="_blank" rel="noreferrer" title="Complemento de pago PDF">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FileText className="size-3.5" />
                          </Button>
                        </a>
                      )}
                      {pmt.complement_xml_url && (
                        <a href={pmt.complement_xml_url} target="_blank" rel="noreferrer" title="Complemento de pago XML">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FileText className="size-3.5 text-muted-foreground" />
                          </Button>
                        </a>
                      )}
                      {canEdit && onUploadComplement && projectId && !pmt.complement_pdf_url && !pmt.complement_xml_url && (
                        <UploadPaymentComplementDialog
                          paymentId={pmt.id}
                          projectId={projectId}
                          onUpload={onUploadComplement}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Subir complemento de pago">
                              <Upload className="size-3.5" />
                            </Button>
                          }
                        />
                      )}
                      {canEdit && pmt.remaining > 0 && pendingInvoices.length > 0 && (
                        <ReconcilePaymentDialog
                          paymentId={pmt.id}
                          remaining={pmt.remaining}
                          pendingInvoices={pendingInvoices}
                          onApply={onApply}
                          trigger={
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              Aplicar
                            </Button>
                          }
                        />
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Eliminar pago"
                          onClick={() => handleDelete(pmt.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
