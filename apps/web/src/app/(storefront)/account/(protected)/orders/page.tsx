import { MyOrdersTable } from "@/features/customer-orders/components/my-orders-table";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyOrders } from "@/services/customer-orders/list-my-orders";

export default async function AccountOrdersPage() {
  const session = await requireCustomerSession();
  const orders = await listMyOrders(session);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Order history</h1>
      <MyOrdersTable orders={orders} />
    </div>
  );
}
