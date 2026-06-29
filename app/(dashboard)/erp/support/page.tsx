import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { SupportSubscriptionList } from "@/components/erp/SupportSubscriptionList";
import { SupportBillingPanel } from "@/components/erp/SupportBillingPanel";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listSupportSubscriptions } from "@/services/support-subscriptions.service";
import { listSupportBillingRecords } from "@/services/support-billing.service";
import { listAccountOptions } from "@/services/accounts.service";
import { listProjects } from "@/services/projects.service";
import {
  createSupportSubscriptionAction,
  deleteSupportSubscriptionAction,
  generateMonthlyBillingRecordsAction,
  markSupportBillingPaidAction,
  updateSupportSubscriptionAction,
} from "./actions";

export default async function ErpSupportPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [subscriptions, accounts, projects, billingRecords] = await Promise.all([
    listSupportSubscriptions(),
    listAccountOptions(),
    listProjects(),
    listSupportBillingRecords(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Soporte (MRR)" description="Suscripciones de soporte mensual recurrente" />
        <SupportSubscriptionList
          subscriptions={subscriptions}
          accounts={accounts}
          projects={projects}
          onCreate={createSupportSubscriptionAction}
          onUpdate={updateSupportSubscriptionAction}
          onDelete={deleteSupportSubscriptionAction}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Cobros del mes</h3>
        <SupportBillingPanel
          records={billingRecords}
          onGenerate={generateMonthlyBillingRecordsAction}
          onMarkPaid={markSupportBillingPaidAction}
        />
      </div>
    </div>
  );
}
