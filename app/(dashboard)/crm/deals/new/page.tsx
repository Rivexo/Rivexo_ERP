import { DealForm } from "@/components/crm/DealForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { canViewFinancials } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProfiles } from "@/services/profiles.service";
import { listAccountOptions } from "@/services/accounts.service";
import { listContacts } from "@/services/contacts.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";
import { createDealAction } from "../actions";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ account_id?: string }>;
}) {
  const { account_id } = await searchParams;
  const [profile, accounts, contacts, businessLines, owners, stages] = await Promise.all([
    getCurrentProfile(),
    listAccountOptions(),
    listContacts(),
    listBusinessLines(),
    listProfiles(),
    listPipelineStages(),
  ]);

  return (
    <div>
      <PageHeader title="Nuevo deal" />
      <DealForm
        defaultAccountId={account_id}
        accounts={accounts}
        contacts={contacts}
        businessLines={businessLines}
        owners={owners}
        stages={stages}
        canViewFinancials={profile ? canViewFinancials(profile.role) : false}
        onSubmit={createDealAction}
      />
    </div>
  );
}
