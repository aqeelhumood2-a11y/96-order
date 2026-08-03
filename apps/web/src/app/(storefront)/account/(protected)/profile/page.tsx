import { ProfileForm } from "@/features/customer-auth/components/profile-form";
import { getMyAccount } from "@/services/customer-auth/get-account";
import { requireCustomerSession } from "@/services/customer-auth/session";

export default async function AccountProfilePage() {
  const session = await requireCustomerSession();
  const account = await getMyAccount(session);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Profile</h1>
      <p className="text-sm text-foreground/60">{account.email}</p>
      <ProfileForm fullName={account.displayName} mobile={account.mobile} />
    </div>
  );
}
