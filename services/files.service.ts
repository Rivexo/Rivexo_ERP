import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type FileRow = Database["public"]["Tables"]["files"]["Row"];

export type FileWithUploader = FileRow & {
  uploader: { id: string; full_name: string } | null;
  url: string | null;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function attachSignedUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: (FileRow & { uploader: { id: string; full_name: string } | null })[],
): Promise<FileWithUploader[]> {
  return Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage.from(row.bucket).createSignedUrl(row.path, SIGNED_URL_TTL_SECONDS);
      return { ...row, url: signed?.signedUrl ?? null };
    }),
  );
}

export async function listFiles(entityType: string, entityId: string): Promise<FileWithUploader[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*, uploader:profiles(id, full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return attachSignedUrls(supabase, data as unknown as (FileRow & { uploader: { id: string; full_name: string } | null })[]);
}

// Mapa entity_id -> primer archivo, para listas que muestran un archivo por fila
// (ej. una factura de freelancer por proyecto) sin hacer un round-trip por fila.
export async function listFilesByEntityIds(
  entityType: string,
  entityIds: string[],
): Promise<Record<string, FileWithUploader | undefined>> {
  if (entityIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*, uploader:profiles(id, full_name)")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const withUrls = await attachSignedUrls(
    supabase,
    data as unknown as (FileRow & { uploader: { id: string; full_name: string } | null })[],
  );

  const map: Record<string, FileWithUploader> = {};
  for (const file of withUrls) {
    if (!map[file.entity_id]) map[file.entity_id] = file;
  }
  return map;
}

export async function listContractsByAccount(accountId: string): Promise<FileWithUploader[]> {
  const supabase = await createClient();
  const { data: deals, error: dealsError } = await supabase.from("deals").select("id").eq("account_id", accountId);
  if (dealsError) throw dealsError;

  const dealIds = deals.map((d) => d.id);
  if (dealIds.length === 0) return [];

  const { data, error } = await supabase
    .from("files")
    .select("*, uploader:profiles(id, full_name)")
    .eq("entity_type", "deal")
    .in("entity_id", dealIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return attachSignedUrls(supabase, data as unknown as (FileRow & { uploader: { id: string; full_name: string } | null })[]);
}

export async function uploadFile(entityType: string, entityId: string, file: File, bucket = "contracts"): Promise<void> {
  if (file.type !== "application/pdf") {
    throw new Error("Solo se permiten archivos PDF");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No autenticado");

  const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("files").insert({
    entity_type: entityType,
    entity_id: entityId,
    bucket,
    path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userData.user.id,
  });
  if (error) throw error;
}

export async function deleteFile(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: fileRow, error: fetchError } = await supabase.from("files").select("bucket, path").eq("id", id).single();
  if (fetchError) throw fetchError;

  const { error: storageError } = await supabase.storage.from(fileRow.bucket).remove([fileRow.path]);
  if (storageError) throw storageError;

  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) throw error;
}
