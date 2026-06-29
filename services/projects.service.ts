import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { ProjectInput } from "@/lib/validations/project";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectFinancials = Database["public"]["Tables"]["project_financials"]["Row"];

export type ProjectWithRelations = Project & {
  account: { id: string; name: string } | null;
  business_line: { id: string; name: string } | null;
  project_manager: { id: string; full_name: string } | null;
};

const PROJECT_RELATIONS_SELECT = `
  *,
  account:accounts(id, name),
  business_line:business_lines(id, name),
  project_manager:profiles!projects_project_manager_id_fkey(id, full_name)
`;

export async function listProjects(): Promise<ProjectWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_RELATIONS_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ProjectWithRelations[];
}

export async function getProjectByDealId(dealId: string): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("id").eq("deal_id", dealId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProject(id: string): Promise<ProjectWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select(PROJECT_RELATIONS_SELECT).eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as unknown as ProjectWithRelations;
}

// Returns null (not an error) when RLS hides project_financials from the caller's role.
export async function getProjectFinancials(projectId: string): Promise<ProjectFinancials | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_financials")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  const supabase = await createClient();
  const { budget_sold, direct_cost, ...projectFields } = input;

  const { error } = await supabase.from("projects").update(projectFields).eq("id", id);
  if (error) throw error;

  if (budget_sold !== null && budget_sold !== undefined && direct_cost !== null && direct_cost !== undefined) {
    const { error: financialsError } = await supabase
      .from("project_financials")
      .upsert({ project_id: id, budget_sold, direct_cost });
    if (financialsError) throw financialsError;
  }
}

export async function listProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("*, user:profiles(id, full_name, role)")
    .eq("project_id", projectId);
  if (error) throw error;
  return data;
}

export async function addProjectMember(projectId: string, userId: string, roleInProject?: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role_in_project: roleInProject ?? null });
  if (error) throw error;
}

export async function removeProjectMember(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").delete().eq("id", memberId);
  if (error) throw error;
}
