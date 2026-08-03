import { ForbiddenError } from "@/core/errors";
import { CouponsList } from "@/features/admin-coupons/components/coupons-list";
import { listCoupons } from "@/services/coupons/manage-coupons";
import { requireSession } from "@/services/auth/session";

export default async function AdminCouponsPage() {
  const session = await requireSession();

  let page;
  try {
    page = await listCoupons(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Coupons</h1>
      <CouponsList coupons={page.items} />
    </div>
  );
}
