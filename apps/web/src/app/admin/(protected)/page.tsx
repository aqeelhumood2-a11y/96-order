import { ForbiddenError } from "@/core/errors";
import { formatMoney } from "@/core/money/money";
import { StatTile } from "@/features/admin-dashboard/components/stat-tile";
import { InventoryAlerts } from "@/features/admin-dashboard/components/inventory-alerts";
import { TopSellingProducts } from "@/features/admin-dashboard/components/top-selling-products";
import { OrdersTable } from "@/features/admin-orders/components/orders-table";
import { getDashboardStats } from "@/services/dashboard/get-dashboard-stats";
import { requireSession } from "@/services/auth/session";

export default async function AdminDashboardPage() {
  const session = await requireSession();

  let stats;
  try {
    stats = await getDashboardStats(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Dashboard</h1>
        <p className="text-sm text-foreground/70">Signed in as {session.email}.</p>
        <p className="text-sm text-foreground/70">You don&apos;t have permission to view the dashboard.</p>
      </div>
    );
  }

  const { counts } = stats;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total orders" value={counts.totalOrders} />
        <StatTile label="Revenue" value={formatMoney(counts.totalRevenue)} />
        <StatTile label="Pending payment" value={counts.ordersByStatus.pending_payment} />
        <StatTile label="Confirmed" value={counts.ordersByStatus.confirmed} />
        <StatTile label="Preparing" value={counts.ordersByStatus.preparing} />
        <StatTile label="Ready" value={counts.ordersByStatus.ready} />
        <StatTile label="Out for delivery" value={counts.ordersByStatus.out_for_delivery} />
        <StatTile label="Completed" value={counts.ordersByStatus.completed} />
        <StatTile label="Cancelled" value={counts.ordersByStatus.cancelled} />
      </div>

      <InventoryAlerts lowStock={stats.lowStock} outOfStock={stats.outOfStock} />

      <TopSellingProducts products={stats.topSellingProducts} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">Recent orders</h2>
        <OrdersTable orders={stats.recentOrders} />
      </div>
    </div>
  );
}
