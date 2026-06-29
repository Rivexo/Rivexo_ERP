import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database.types";
import type { EntityType } from "@/services/comments.service";

export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

export type ActivityLogWithActor = ActivityLog & {
  actor: { id: string; full_name: string } | null;
};

export async function listActivity(entityType: EntityType, entityId: string): Promise<ActivityLogWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, actor:profiles(id, full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ActivityLogWithActor[];
}

export async function logActivity(
  entityType: EntityType,
  entityId: string,
  action: string,
  actorId: string,
  description: string,
  diff?: Json,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_log").insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_id: actorId,
    description,
    diff: diff ?? null,
  });
  if (error) throw error;
}
