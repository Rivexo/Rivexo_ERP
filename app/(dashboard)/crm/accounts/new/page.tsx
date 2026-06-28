import { AccountForm } from "@/components/crm/AccountForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProfiles } from "@/services/profiles.service";
import { createAccountAction } from "../actions";

export default async function NewAccountPage() {
  const owners = await listProfiles();

  return (
    <div>
      <PageHeader title="Nueva cuenta" />
      <AccountForm owners={owners} onSubmit={createAccountAction} />
    </div>
  );
}
