import Link from "next/link";
import { PRODUCT_STATUSES, type ProductStatus } from "@/core/catalog/entities";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { ProductsTable } from "@/features/catalog/products/components/products-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { listProducts } from "@/services/catalog/list-products";
import { requireSession } from "@/services/auth/session";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Select } from "@/ui/primitives/select";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const dict = getDictionary(locale).admin.productsPage;
  const raw = await searchParams;
  const statusParam = typeof raw.status === "string" ? raw.status : "";
  const status = isProductStatus(statusParam) ? statusParam : undefined;
  const search = typeof raw.search === "string" && raw.search.trim() ? raw.search.trim() : undefined;

  let products;
  try {
    products = await listProducts(session, { limit: 50, status, search });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!products) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const canManage = hasPermission(session, "products:create");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        {canManage && (
          <Button asChild>
            <Link href="/admin/products/new">{dict.addProduct}</Link>
          </Button>
        )}
      </div>

      <form action="/admin/products" method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-search-filter" className="text-sm font-medium text-foreground">
            {dict.search}
          </label>
          <Input id="product-search-filter" name="search" defaultValue={search ?? ""} placeholder={dict.searchPlaceholder} className="w-64" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-status-filter" className="text-sm font-medium text-foreground">
            {dict.status}
          </label>
          <Select id="product-status-filter" name="status" defaultValue={status ?? ""} className="w-44">
            <option value="">{dict.allStatuses}</option>
            {PRODUCT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline" size="sm">
          {dict.filter}
        </Button>
        {(status || search) && (
          <Link href="/admin/products" className="pb-2 text-sm text-brand-700 hover:underline">
            {dict.clear}
          </Link>
        )}
      </form>

      <ProductsTable products={products.items} canManage={hasPermission(session, "products:edit")} locale={locale} />
    </div>
  );
}
