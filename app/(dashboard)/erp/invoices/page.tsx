import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { CustomerInvoiceList } from "@/components/erp/CustomerInvoiceList";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listAllInvoices } from "@/services/customer-invoices.service";
import {
  deleteInvoiceGlobalAction,
  updateInvoiceStatusGlobalAction,
  uploadInvoiceFilesGlobalAction,
} from "./actions";

export default async function InvoicesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const invoices = await listAllInvoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Facturas emitidas a clientes en todos los proyectos"
      />

      <CustomerInvoiceList
        invoices={invoices}
        canEdit={true}
        showProject={true}
        onUpload={uploadInvoiceFilesGlobalAction}
        onStatusChange={updateInvoiceStatusGlobalAction}
        onDelete={deleteInvoiceGlobalAction}
      />
    </div>
  );
}
