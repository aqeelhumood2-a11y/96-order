import { ForbiddenError } from "@/core/errors";
import { CouponsList } from "@/features/admin-coupons/components/coupons-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { listCoupons } from "@/services/coupons/manage-coupons";
import { requireSession } from "@/services/auth/session";

export default async function AdminCouponsPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let page;
  try {
    page = await listCoupons(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{getDictionary(locale).admin.couponsPage.heading}</h1>
      <CouponsList coupons={page.items} locale={locale} />
    </div>
  );
}
