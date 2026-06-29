import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { JournalEntryList } from "@/components/erp/JournalEntryList";
import { ManualJournalEntryDialog } from "@/components/erp/ManualJournalEntryDialog";
import { PostFixedCostsButton } from "@/components/erp/PostFixedCostsButton";
import { canAccessErp } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/profiles.service";
import { listChartOfAccounts, listJournalEntries } from "@/services/accounting.service";
import { createManualJournalEntryAction, postMonthlyFixedCostsAction } from "./actions";
import { Plus } from "lucide-react";

export default async function JournalPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessErp(profile.role)) redirect("/");

  const [entries, accounts] = await Promise.all([listJournalEntries(), listChartOfAccounts()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Diario" description="Todos los asientos contables, en base de efectivo" />

      <div className="flex flex-wrap items-center gap-2">
        <ManualJournalEntryDialog
          accounts={accounts}
          onSubmit={createManualJournalEntryAction}
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Nuevo asiento manual
            </Button>
          }
        />
        <PostFixedCostsButton onPost={postMonthlyFixedCostsAction} />
      </div>

      <JournalEntryList entries={entries} />
    </div>
  );
}
