import { notFound } from "next/navigation";
import { AccountForm } from "@/components/crm/AccountForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProfiles } from "@/services/profiles.service";
import { getAccount } from "@/services/accounts.service";
import { updateAccountAction } from "../../actions";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, owners] = await Promise.all([getAccount(id), listProfiles()]);
  if (!account) notFound();

  return (
    <div>
      <PageHeader title={`Editar ${account.name}`} />
      <AccountForm account={account} owners={owners} onSubmit={updateAccountAction.bind(null, id)} />
    </div>
  );
}
