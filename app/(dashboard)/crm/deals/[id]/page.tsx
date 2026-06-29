import Link from "next/link";
import { notFound } from "next/navigation";
import { Folder } from "lucide-react";
import { DealForm } from "@/components/crm/DealForm";
import { DealFinancialsPanel } from "@/components/crm/DealFinancialsPanel";
import { ConvertToProjectButton } from "@/components/crm/ConvertToProjectButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { canConvertDealToProject, canViewFinancials } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listProfiles } from "@/services/profiles.service";
import { listAccountOptions } from "@/services/accounts.service";
import { listContacts } from "@/services/contacts.service";
import { listBusinessLines } from "@/services/business-lines.service";
import { listPipelineStages } from "@/services/pipeline-stages.service";
import { getDeal, getDealFinancials } from "@/services/deals.service";
import { getProjectByDealId } from "@/services/projects.service";
import { convertDealToProjectAction, deleteDealAction, updateDealAction } from "../actions";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const [profile, accounts, contacts, businessLines, owners, stages, financials, existingProject] =
    await Promise.all([
      getCurrentProfile(),
      listAccountOptions(),
      listContacts(),
      listBusinessLines(),
      listProfiles(),
      listPipelineStages(),
      getDealFinancials(id),
      getProjectByDealId(id),
    ]);

  const showFinancials = profile ? canViewFinancials(profile.role) : false;
  const canConvert = profile ? canConvertDealToProject(profile.role) : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.name}
        description={deal.account?.name ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {existingProject ? (
              <Button variant="outline" nativeButton={false} render={<Link href={`/projects/${existingProject.id}`} />}>
                <Folder className="size-4" /> Ver proyecto
              </Button>
            ) : (
              canConvert &&
              deal.stage?.is_won && <ConvertToProjectButton onConfirm={convertDealToProjectAction.bind(null, id)} />
            )}
            <ConfirmDeleteButton
              title="Eliminar deal"
              description="Esta acción archivará el deal. ¿Deseas continuar?"
              onConfirm={deleteDealAction.bind(null, id)}
              redirectTo="/crm/deals"
            />
          </div>
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
