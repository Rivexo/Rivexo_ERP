import { notFound } from "next/navigation";
import { DealForm } from "@/components/crm/DealForm";
import { DealFinancialsPanel } from "@/components/crm/DealFinancialsPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";
import { canViewFinancials } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProfiles } from "@/services/profiles.service";
import { listAccountOptions } from "@/services/accounts.service";
import { listContacts } from "@/services/contacts.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";
import { getDeal, getDealFinancials } from "@/services/deals.service";
import { deleteDealAction, updateDealAction } from "../actions";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const [profile, accounts, contacts, businessLines, owners, stages, financials] = await Promise.all([
    getCurrentProfile(),
    listAccountOptions(),
    listContacts(),
    listBusinessLines(),
    listProfiles(),
    listPipelineStages(),
    getDealFinancials(id),
  ]);

  const showFinancials = profile ? canViewFinancials(profile.role) : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.name}
        description={deal.account?.name ?? undefined}
        action={
          <ConfirmDeleteButton
            title="Eliminar deal"
            description="Esta acción archivará el deal. ¿Deseas continuar?"
            onConfirm={deleteDealAction.bind(null, id)}
            redirectTo="/crm/deals"
          />
        }
      />

      {showFinancials && <DealFinancialsPanel financials={financials} />}

      <DealForm
        deal={deal}
        accounts={accounts}
        contacts={contacts}
        businessLines={businessLines}
        owners={owners}
        stages={stages}
        canViewFinancials={showFinancials}
        initialEstimatedDirectCost={financials?.estimated_direct_cost}
        onSubmit={updateDealAction.bind(null, id)}
      />
    </div>
  );
}
