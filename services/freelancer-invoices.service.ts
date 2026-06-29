import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { FreelancerInvoiceInput } from "@/lib/validations/freelancer-invoice";

export type FreelancerInvoice = Database["public"]["Tables"]["freelancer_invoices"]["Row"];

export type FreelancerInvoiceWithRelations = FreelancerInvoice & {
  project: { id: string; name: string } | null;
};

export async function listFreelancerInvoices(): Promise<FreelancerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freelancer_invoices")
    .select("*, project:projects(id, name)")
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return data as unknown as FreelancerInvoiceWithRelations[];
}

export async function listFreelancerInvoicesByProject(projectId: string): Promise<FreelancerInvoiceWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("freelancer_invoices")
    .select("*, project:projects(id, name)")
    .eq("project_id", projectId)
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return data as unknown as FreelancerInvoiceWithRelations[];
}

export async function createFreelancerInvoice(input: FreelancerInvoiceInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("freelancer_invoices").insert(input).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateFreelancerInvoice(id: string, input: FreelancerInvoiceInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("freelancer_invoices").update(input).eq("id", id);
  if (error) throw error;
}

export async function updateFreelancerInvoiceStatus(id: string, status: "pending" | "paid"): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("freelancer_invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFreelancerInvoice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("freelancer_invoices").delete().eq("id", id);
  if (error) throw error;
}
