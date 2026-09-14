import { NotificationPreferencesForm } from "@/features/customer-auth/components/notification-preferences-form";
import { BackInStockSubscriptionsList } from "@/features/back-in-stock/components/subscriptions-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getMyAccount } from "@/services/customer-auth/get-account";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyBackInStockSubscriptions } from "@/services/back-in-stock/list-my-subscriptions";

export default async function AccountNotificationsPage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const account = await getMyAccount(session);
  const subscriptions = await listMyBackInStockSubscriptions(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.notificationPreferencesHeading}</h1>
        <NotificationPreferencesForm preferences={account.notificationPreferences} marketingConsent={account.marketingConsent} locale={locale} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-950">{dict.backInStockAlertsHeading}</h2>
        <BackInStockSubscriptionsList subscriptions={subscriptions} locale={locale} />
      </div>
    </div>
  );
}
