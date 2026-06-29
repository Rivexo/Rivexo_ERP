import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type EntityType = "project" | "task";
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

export type CommentWithAuthor = Comment & {
  author: { id: string; full_name: string } | null;
};

export async function listComments(entityType: EntityType, entityId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(id, full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as CommentWithAuthor[];
}

export async function createComment(
  entityType: EntityType,
  entityId: string,
  body: string,
  authorId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ entity_type: entityType, entity_id: entityId, body, author_id: authorId });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}
