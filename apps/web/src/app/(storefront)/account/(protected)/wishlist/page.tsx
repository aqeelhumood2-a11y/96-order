import { WishlistGrid } from "@/features/wishlist/components/wishlist-grid";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyWishlist } from "@/services/wishlist/wishlist";

export default async function AccountWishlistPage() {
  const session = await requireCustomerSession();
  const items = await listMyWishlist(session);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Wishlist</h1>
      <WishlistGrid items={items} />
    </div>
  );
}
