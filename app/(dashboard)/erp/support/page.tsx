import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { SupportSubscriptionList } from "@/components/erp/SupportSubscriptionList";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listSupportSubscriptions } from "@/services/support-subscriptions.service";
import { listAccountOptions } from "@/services/accounts.service";
import { listProjects } from "@/services/projects.service";
import {
  createSupportSubscriptionAction,
  deleteSupportSubscriptionAction,
  updateSupportSubscriptionAction,
} from "./actions";

export default async function ErpSupportPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [subscriptions, accounts, projects] = await Promise.all([
    listSupportSubscriptions(),
    listAccountOptions(),
    listProjects(),
  ]);

  return (
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
  );
}
