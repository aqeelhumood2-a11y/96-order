import { NotificationPreferencesForm } from "@/features/customer-auth/components/notification-preferences-form";
import { BackInStockSubscriptionsList } from "@/features/back-in-stock/components/subscriptions-list";
import { getMyAccount } from "@/services/customer-auth/get-account";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyBackInStockSubscriptions } from "@/services/back-in-stock/list-my-subscriptions";

export default async function AccountNotificationsPage() {
  const session = await requireCustomerSession();
  const account = await getMyAccount(session);
  const subscriptions = await listMyBackInStockSubscriptions(session);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Notification preferences</h1>
        <NotificationPreferencesForm preferences={account.notificationPreferences} marketingConsent={account.marketingConsent} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-950">Back-in-stock alerts</h2>
        <BackInStockSubscriptionsList subscriptions={subscriptions} />
      </div>
    </div>
  );
}
