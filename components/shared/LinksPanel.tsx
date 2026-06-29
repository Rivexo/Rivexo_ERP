"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Link as LinkRow } from "@/services/links.service";
import type { EntityType } from "@/services/comments.service";

export function LinksPanel({
  entityType,
  entityId,
  links,
  onCreate,
  onDelete,
}: {
  entityType: EntityType;
  entityId: string;
  links: LinkRow[];
  onCreate: (entityType: EntityType, entityId: string, url: string, label: string | null) => Promise<void>;
  onDelete: (entityType: EntityType, entityId: string, id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!url.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate(entityType, entityId, url.trim(), label.trim() || null);
      setUrl("");
      setLabel("");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await onDelete(entityType, entityId, id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Links</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Agregar link">
                <Plus className="size-4" />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo link</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
              <Input placeholder="Etiqueta (opcional)" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={isSubmitting || !url.trim()}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 truncate text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              {link.label || link.url}
            </a>
            <Button variant="ghost" size="icon" aria-label="Eliminar link" onClick={() => handleDelete(link.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {links.length === 0 && <p className="text-sm text-muted-foreground">Sin links todavía.</p>}
      </CardContent>
    </Card>
  );
}
