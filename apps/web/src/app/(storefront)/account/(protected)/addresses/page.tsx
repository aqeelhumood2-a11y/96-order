import { AddressesList } from "@/features/customer-addresses/components/addresses-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyAddresses } from "@/services/customer-addresses/addresses";

export default async function AccountAddressesPage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const addresses = await listMyAddresses(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.savedAddressesHeading}</h1>
      <AddressesList addresses={addresses} locale={locale} />
    </div>
  );
}
