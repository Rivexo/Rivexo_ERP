"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import type { PendingInvoiceOption } from "@/services/customer-payments.service";

const METHOD_OPTIONS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "otro", label: "Otro" },
] as const;

export function CustomerPaymentDialog({
  pendingInvoices,
  trigger,
  onCreate,
}: {
  pendingInvoices: PendingInvoiceOption[];
  trigger: React.ReactNode;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    formData.set("payment_method", method);
    formData.set("invoice_id", selectedInvoice);
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      formRef.current?.reset();
      setMethod("");
      setSelectedInvoice("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min={0.01} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid_at">Fecha de pago *</Label>
              <Input
                id="paid_at"
                name="paid_at"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={method} onValueChange={(v) => setMethod(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona…">
                  {(v: string | null) => METHOD_OPTIONS.find((o) => o.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bank_reference">Referencia bancaria</Label>
              <Input id="bank_reference" name="bank_reference" placeholder="CLABE / No. Op" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account">Cuenta bancaria</Label>
              <Input id="bank_account" name="bank_account" placeholder="Nombre o últimos 4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Comprobante de pago</Label>
            <Input id="receipt" name="receipt" type="file" accept="application/pdf,image/*" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Complemento de pago CFDI</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="complement_pdf" className="text-xs text-muted-foreground">PDF</Label>
                <Input id="complement_pdf" name="complement_pdf" type="file" accept="application/pdf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement_xml" className="text-xs text-muted-foreground">XML</Label>
                <Input id="complement_xml" name="complement_xml" type="file" accept=".xml,text/xml,application/xml" />
              </div>
            </div>
          </div>

          {pendingInvoices.length > 0 && (
            <div className="space-y-2">
              <Label>Aplicar a factura (opcional)</Label>
              <Select value={selectedInvoice} onValueChange={(v) => setSelectedInvoice(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una factura pendiente">
                    {(v: string | null) => {
                      const inv = pendingInvoices.find((i) => i.id === v);
                      return inv ? `${inv.folio_display} — saldo ${formatCurrency(inv.balance_due)}` : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {pendingInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.folio_display} — saldo {formatCurrency(inv.balance_due)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInvoice && (
                <div className="space-y-2">
                  <Label htmlFor="amount_applied">Monto a aplicar</Label>
                  <Input
                    id="amount_applied"
                    name="amount_applied"
                    type="number"
                    step="0.01"
                    min={0.01}
                    defaultValue={
                      pendingInvoices.find((i) => i.id === selectedInvoice)?.balance_due ?? ""
                    }
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UploadPaymentComplementDialog({
  paymentId,
  projectId,
  trigger,
  onUpload,
}: {
  paymentId: string;
  projectId: string;
  trigger: React.ReactNode;
  onUpload: (projectId: string, paymentId: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    setIsSubmitting(true);
    try {
      await onUpload(projectId, paymentId, formData);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir complemento de pago CFDI</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comp-pdf">PDF</Label>
            <Input id="comp-pdf" name="complement_pdf" type="file" accept="application/pdf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-xml">XML</Label>
            <Input id="comp-xml" name="complement_xml" type="file" accept=".xml,text/xml,application/xml" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReconcilePaymentDialog({
  paymentId,
  remaining,
  pendingInvoices,
  trigger,
  onApply,
}: {
  paymentId: string;
  remaining: number;
  pendingInvoices: PendingInvoiceOption[];
  trigger: React.ReactNode;
  onApply: (paymentId: string, invoiceId: string, amountApplied: number) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedInv = pendingInvoices.find((i) => i.id === invoiceId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) { setError("Selecciona una factura"); return; }
    const num = Number(amount);
    if (!num || num <= 0) { setError("Ingresa un monto válido"); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await onApply(paymentId, invoiceId, num);
      setInvoiceId("");
      setAmount("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar a factura</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Disponible: <strong className="text-foreground">{formatCurrency(remaining)}</strong>
          </p>

          <div className="space-y-2">
            <Label>Factura</Label>
            <Select value={invoiceId} onValueChange={(v) => {
              setInvoiceId(v ?? "");
              const inv = pendingInvoices.find((i) => i.id === v);
              if (inv) setAmount(String(Math.min(inv.balance_due, remaining)));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona…">
                  {(v: string | null) => {
                    const inv = pendingInvoices.find((i) => i.id === v);
                    return inv ? `${inv.folio_display} — saldo ${formatCurrency(inv.balance_due)}` : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pendingInvoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.folio_display} — saldo {formatCurrency(inv.balance_due)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reconcile-amount">Monto a aplicar</Label>
            <Input
              id="reconcile-amount"
              type="number"
              step="0.01"
              min={0.01}
              max={Math.min(selectedInv?.balance_due ?? remaining, remaining)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !invoiceId}>
              {isSubmitting ? "Aplicando..." : "Aplicar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
