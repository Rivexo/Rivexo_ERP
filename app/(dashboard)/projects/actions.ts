"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";
import { canManageProjectFinancials } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { updateProject } from "@/services/projects.service";
import { createComment, deleteComment, type EntityType } from "@/services/comments.service";
import { createLink, deleteLink } from "@/services/links.service";

export async function updateProjectAction(id: string, input: ProjectInput): Promise<void> {
  const parsed = projectSchema.parse(input);
  const profile = await getCurrentProfile();

  // RLS would reject the project_financials write for non-finance/admin roles anyway;
  // stripping it here avoids failing the whole update (name/dates/status) over fields
  // the caller never actually had permission to change.
  if (!profile || !canManageProjectFinancials(profile.role)) {
    parsed.budget_sold = undefined;
    parsed.direct_cost = undefined;
    parsed.is_financed = undefined;
    parsed.financed_total = undefined;
    parsed.financing_term_months = undefined;
  }

  await updateProject(id, parsed);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function createCommentAction(entityType: EntityType, entityId: string, body: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await createComment(entityType, entityId, body, user.id);
  revalidatePath(`/projects/${entityId}`);
}

export async function deleteCommentAction(entityType: EntityType, entityId: string, id: string): Promise<void> {
  await deleteComment(id);
  revalidatePath(`/projects/${entityId}`);
}

export async function createLinkAction(
  entityType: EntityType,
  entityId: string,
  url: string,
  label: string | null,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await createLink(entityType, entityId, url, label, user.id);
  revalidatePath(`/projects/${entityId}`);
}

export async function deleteLinkAction(entityType: EntityType, entityId: string, id: string): Promise<void> {
  await deleteLink(id);
  revalidatePath(`/projects/${entityId}`);
}
