import Link from "next/link";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { ProductsTable } from "@/features/catalog/products/components/products-table";
import { listProducts } from "@/services/catalog/list-products";
import { requireSession } from "@/services/auth/session";
import { Button } from "@/ui/primitives/button";

export default async function ProductsPage() {
  const session = await requireSession();

  let products;
  try {
    products = await listProducts(session, { limit: 50 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!products) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const canManage = hasPermission(session, "products:create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Products</h1>
        {canManage && (
          <Button asChild>
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        )}
      </div>
      <ProductsTable products={products.items} canManage={hasPermission(session, "products:edit")} />
    </div>
  );
}
