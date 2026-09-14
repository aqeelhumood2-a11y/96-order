import { ProfileForm } from "@/features/customer-auth/components/profile-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getMyAccount } from "@/services/customer-auth/get-account";
import { requireCustomerSession } from "@/services/customer-auth/session";

export default async function AccountProfilePage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const account = await getMyAccount(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.profileHeading}</h1>
      <p className="text-sm text-foreground/69">{account.email}</p>
      <ProfileForm fullName={account.displayName} mobile={account.mobile} locale={locale} />
    </div>
  );
}
