import { ForbiddenError } from "@/core/errors";
import { formatMoney } from "@/core/money/money";
import { StatTile } from "@/features/admin-dashboard/components/stat-tile";
import { InventoryAlerts } from "@/features/admin-dashboard/components/inventory-alerts";
import { TopSellingProducts } from "@/features/admin-dashboard/components/top-selling-products";
import { OrdersTable } from "@/features/admin-orders/components/orders-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getDashboardStats } from "@/services/dashboard/get-dashboard-stats";
import { requireSession } from "@/services/auth/session";

export default async function AdminDashboardPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const dict = getDictionary(locale).admin.dashboardPage;
  const orderStatusDict = getDictionary(locale).admin.orderStatus;

  let stats;
  try {
    stats = await getDashboardStats(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <p className="text-sm text-foreground/70">{dict.signedInAs.replace("{email}", session.email)}</p>
        <p className="text-sm text-foreground/70">{dict.noPermission}</p>
      </div>
    );
  }

  const { counts } = stats;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label={dict.totalOrders} value={counts.totalOrders} />
        <StatTile label={dict.revenue} value={formatMoney(counts.totalRevenue)} />
        <StatTile label={orderStatusDict.pending_payment} value={counts.ordersByStatus.pending_payment} />
        <StatTile label={orderStatusDict.confirmed} value={counts.ordersByStatus.confirmed} />
        <StatTile label={orderStatusDict.preparing} value={counts.ordersByStatus.preparing} />
        <StatTile label={orderStatusDict.ready} value={counts.ordersByStatus.ready} />
        <StatTile label={orderStatusDict.out_for_delivery} value={counts.ordersByStatus.out_for_delivery} />
        <StatTile label={orderStatusDict.completed} value={counts.ordersByStatus.completed} />
        <StatTile label={orderStatusDict.cancelled} value={counts.ordersByStatus.cancelled} />
      </div>

      <InventoryAlerts lowStock={stats.lowStock} outOfStock={stats.outOfStock} locale={locale} />

      <TopSellingProducts products={stats.topSellingProducts} locale={locale} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">{dict.recentOrders}</h2>
        <OrdersTable orders={stats.recentOrders} locale={locale} />
      </div>
    </div>
  );
}
