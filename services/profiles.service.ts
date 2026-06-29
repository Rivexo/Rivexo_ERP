import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data;
}

export async function updateProfileRole(id: string, role: UserRole): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function updateProfileActive(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function updateProfileInfo(id: string, input: { full_name: string; phone?: string | null }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(input).eq("id", id);
  if (error) throw error;
}

// Path fijo por usuario (no por archivo): cada subida sobrescribe la foto anterior en
// Storage (sin huerfanos), y se agrega un query param de cache-busting a la URL guardada.
export async function updateAvatar(userId: string, file: File): Promise<string> {
  const supabase = await createClient();
  const path = `${userId}/avatar`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) throw error;

  return avatarUrl;
}
