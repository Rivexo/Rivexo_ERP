"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileWithUploader } from "@/services/files.service";

export function ContractsPanel({
  contracts,
  onUpload,
  onDelete,
  readOnly = false,
}: {
  contracts: FileWithUploader[];
  onUpload?: (formData: FormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF");
      e.target.value = "";
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await onUpload(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al subir el archivo");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!onDelete) return;
    await onDelete(id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Contratos</CardTitle>
        {!readOnly && onUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="ghost" size="icon" aria-label="Subir contrato" disabled={isUploading} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" />
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {contracts.map((contract) => (
          <div key={contract.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
            <a
              href={contract.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1.5 truncate text-sm text-primary hover:underline"
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{contract.file_name}</span>
            </a>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {new Date(contract.created_at).toLocaleDateString("es-MX")} · {contract.uploader?.full_name ?? "—"}
              </span>
              {!readOnly && onDelete && (
                <Button variant="ghost" size="icon" aria-label="Eliminar contrato" onClick={() => handleDelete(contract.id)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {contracts.length === 0 && <p className="text-sm text-muted-foreground">Sin contratos todavía.</p>}
      </CardContent>
    </Card>
  );
}
