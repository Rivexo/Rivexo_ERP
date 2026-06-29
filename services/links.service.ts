import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { EntityType } from "@/services/comments.service";

export type Link = Database["public"]["Tables"]["links"]["Row"];

export async function listLinks(entityType: EntityType, entityId: string): Promise<Link[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLink(
  entityType: EntityType,
  entityId: string,
  url: string,
  label: string | null,
  createdBy: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("links")
    .insert({ entity_type: entityType, entity_id: entityId, url, label, created_by: createdBy });
  if (error) throw error;
}

export async function deleteLink(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) throw error;
}
