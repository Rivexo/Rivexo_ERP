import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { FreelancerInvoiceList } from "@/components/erp/FreelancerInvoiceList";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listFreelancerInvoices } from "@/services/freelancer-invoices.service";
import { listFilesByEntityIds } from "@/services/files.service";
import { listProjects } from "@/services/projects.service";
import { createFreelancerInvoiceAction, deleteFreelancerInvoiceAction, toggleFreelancerInvoiceStatusAction } from "./actions";

export default async function ErpFreelancersPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [invoices, projects] = await Promise.all([listFreelancerInvoices(), listProjects()]);
  const files = await listFilesByEntityIds(
    "freelancer_invoice",
    invoices.map((i) => i.id),
  );

  return (
    <div>
      <PageHeader title="Freelancers" description="Facturas de freelancers ligadas a cada proyecto" />
      <FreelancerInvoiceList
        invoices={invoices}
        files={files}
        projects={projects}
        onCreate={createFreelancerInvoiceAction}
        onToggleStatus={toggleFreelancerInvoiceStatusAction}
        onDelete={deleteFreelancerInvoiceAction}
      />
    </div>
  );
}
