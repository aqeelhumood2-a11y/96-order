import Link from "next/link";
import type { Brand, Category } from "@/core/catalog/entities";
import { ForbiddenError } from "@/core/errors";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

  const dict = getDictionary(locale).admin;

  if (!data) {
    return <p className="text-sm text-foreground/70">{dict.noPermissionPage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-brand-700 hover:underline">
          {dict.productsPage.backToProducts}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.productsPage.addProduct}</h1>
      </div>
      <ProductForm categories={data.categories} brands={data.brands} locale={locale} />
    </div>
  );
}
