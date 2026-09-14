import { WishlistGrid } from "@/features/wishlist/components/wishlist-grid";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyWishlist } from "@/services/wishlist/wishlist";

export default async function AccountWishlistPage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const items = await listMyWishlist(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.wishlistHeading}</h1>
      <WishlistGrid items={items} locale={locale} />
    </div>
  );
}
