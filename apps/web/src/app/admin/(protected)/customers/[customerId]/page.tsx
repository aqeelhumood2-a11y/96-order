import Link from "next/link";
import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { formatMoney } from "@/core/money/money";
import { OrdersTable } from "@/features/admin-orders/components/orders-table";
import { getCustomer } from "@/services/customers/get-customer";
import { requireSession } from "@/services/auth/session";

interface CustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requireSession();
  const { customerId } = await params;
  // `Customer.id` is a normalized email (see `core/customer/entities.ts`),
  // so this segment always arrives percent-encoded (`%40` for `@`) —
  // decode it back before using it as a lookup key. Safe to call even if
  // Next.js has already decoded it: `decodeURIComponent` on a string with
  // no `%`-escapes is a no-op.
  const decodedCustomerId = decodeURIComponent(customerId);

  let detail;
  try {
    detail = await getCustomer(session, decodedCustomerId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!detail) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const { customer, orders } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="text-sm text-brand-700 hover:underline">
          ← Customers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{customer.fullName}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-brand-100 p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/65">Total orders</p>
          <p className="text-xl font-semibold text-brand-950">{customer.totalOrders}</p>
        </div>
        <div className="rounded-md border border-brand-100 p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/65">Total spent</p>
          <p className="text-xl font-semibold text-brand-950">{formatMoney(customer.totalSpent)}</p>
        </div>
        <div className="rounded-md border border-brand-100 p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/65">First order</p>
          <p className="text-xl font-semibold text-brand-950">{formatDate(customer.firstOrderAt)}</p>
        </div>
        <div className="rounded-md border border-brand-100 p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/65">Last order</p>
          <p className="text-xl font-semibold text-brand-950">{formatDate(customer.lastOrderAt)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
        <h2 className="text-sm font-semibold text-brand-950">Contact information</h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/69">Email</dt>
            <dd className="text-foreground">{customer.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/69">Mobile</dt>
            <dd className="text-foreground">{customer.mobile}</dd>
          </div>
          {customer.companyName && (
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/69">Company</dt>
              <dd className="text-foreground">{customer.companyName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/69">Account type</dt>
            <dd className="text-foreground">{customer.kind === "guest" ? "Guest checkout" : "Registered account"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-950">Order history</h2>
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
