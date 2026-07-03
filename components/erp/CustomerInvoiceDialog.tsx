"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CustomerInvoiceDialog({
  trigger,
  onCreate,
}: {
  trigger: React.ReactNode;
  onCreate: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(formRef.current!);

    const pdf = formData.get("pdf");
    const xml = formData.get("xml");
    if (pdf instanceof File && pdf.size > 0 && pdf.type !== "application/pdf") {
      setError("El PDF debe ser un archivo .pdf");
      return;
    }
    if (xml instanceof File && xml.size > 0 && !["text/xml", "application/xml"].includes(xml.type)) {
      setError("El XML debe ser un archivo .xml");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="serie">Serie</Label>
              <Input id="serie" name="serie" placeholder="A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folio">Folio</Label>
              <Input id="folio" name="folio" placeholder="1001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uuid_fiscal">UUID fiscal (CFDI)</Label>
            <Input id="uuid_fiscal" name="uuid_fiscal" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal (sin IVA) *</Label>
            <Input id="subtotal" name="subtotal" type="number" step="0.01" min={0} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="issued_at">Fecha de emisión *</Label>
              <Input
                id="issued_at"
                name="issued_at"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_at">Fecha de vencimiento</Label>
              <Input id="due_at" name="due_at" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" name="notes" placeholder="Parcialidad 1 de 3, etc." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pdf">PDF</Label>
              <Input id="pdf" name="pdf" type="file" accept="application/pdf" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="xml">XML (CFDI)</Label>
              <Input id="xml" name="xml" type="file" accept=".xml,text/xml,application/xml" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UploadInvoiceFilesDialog({
  invoiceId,
  trigger,
  onUpload,
}: {
  invoiceId: string;
  trigger: React.ReactNode;
  onUpload: (invoiceId: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    setIsSubmitting(true);
    try {
      await onUpload(invoiceId, formData);
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
          <DialogTitle>Subir archivos de factura</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">PDF</Label>
            <Input id="pdf-upload" name="pdf" type="file" accept="application/pdf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xml-upload">XML (CFDI)</Label>
            <Input id="xml-upload" name="xml" type="file" accept=".xml,text/xml,application/xml" />
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
