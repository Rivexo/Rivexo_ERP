"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AvatarUploader({
  fullName,
  avatarUrl,
  onUpload,
}: {
  fullName: string;
  avatarUrl: string | null;
  onUpload: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      await onUpload(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg">
        {preview || avatarUrl ? <AvatarImage src={preview ?? avatarUrl ?? undefined} alt={fullName} /> : null}
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? "Subiendo..." : "Cambiar foto"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
