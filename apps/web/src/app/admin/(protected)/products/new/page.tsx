import type { Brand, Category } from "@/core/catalog/entities";
import { ForbiddenError } from "@/core/errors";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { getLocale } from "@/lib/i18n/locale";
import { listAllCategories } from "@/services/catalog/list-categories";
import { listBrands } from "@/services/catalog/list-brands";
import { requirePermission, requireSession } from "@/services/auth/session";

export default async function NewProductPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let data: { categories: Category[]; brands: Brand[] } | null = null;
  try {
    requirePermission(session, "products:create");
    const [categories, brandsPage] = await Promise.all([
      listAllCategories(session),
      listBrands(session, { limit: 100 }),
    ]);
    data = { categories, brands: brandsPage.items };
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!data) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Add product</h1>
      <ProductForm categories={data.categories} brands={data.brands} locale={locale} />
    </div>
  );
}
