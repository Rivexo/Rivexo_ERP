"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CommentWithAuthor, EntityType } from "@/services/comments.service";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CommentsPanel({
  entityType,
  entityId,
  comments,
  currentUserId,
  onCreate,
  onDelete,
}: {
  entityType: EntityType;
  entityId: string;
  comments: CommentWithAuthor[];
  currentUserId: string;
  onCreate: (entityType: EntityType, entityId: string, body: string) => Promise<void>;
  onDelete: (entityType: EntityType, entityId: string, id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate(entityType, entityId, body.trim());
      setBody("");
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
      <CardHeader>
        <CardTitle className="text-base">Comentarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials(comment.author?.full_name ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{comment.author?.full_name ?? "—"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString("es-MX")}
                    </span>
                    {comment.author_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        aria-label="Eliminar comentario"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{comment.body}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-muted-foreground">Sin comentarios todavía.</p>}
        </div>

        <div className="flex gap-2">
          <Textarea
            rows={2}
            placeholder="Escribe un comentario..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button onClick={submit} disabled={isSubmitting || !body.trim()}>
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
