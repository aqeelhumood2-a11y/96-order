import Link from "next/link";
import { notFound } from "next/navigation";
import type { Brand, Category, Product } from "@/core/catalog/entities";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { InventoryTable } from "@/features/catalog/inventory/components/inventory-table";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { ProductImages } from "@/features/catalog/products/components/product-images";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getProductInventory, type InventoryOverviewRow } from "@/services/catalog/inventory-overview";
import { listAllCategories } from "@/services/catalog/list-categories";
import { listBrands } from "@/services/catalog/list-brands";
import { getProduct } from "@/services/catalog/list-products";
import { getProductImageUrls } from "@/services/catalog/product-image-urls";
import { requirePermission, requireSession } from "@/services/auth/session";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let data: { product: Product; categories: Category[]; brands: Brand[]; imageUrls: Record<string, string>; inventory: InventoryOverviewRow[] } | null = null;
  let forbidden = false;
  try {
    requirePermission(session, "products:edit");

    const [product, categories, brandsPage] = await Promise.all([
      getProduct(session, productId),
      listAllCategories(session),
      listBrands(session, { limit: 100 }),
    ]);

    if (product) {
      const [imageUrls, inventory] = await Promise.all([getProductImageUrls(session, product), getProductInventory(session, product)]);
      data = { product, categories, brands: brandsPage.items, imageUrls, inventory };
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      forbidden = true;
    } else {
      throw error;
    }
  }

  if (forbidden) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }
  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-sm text-brand-700 hover:underline">
          {getDictionary(locale).admin.productsPage.backToProducts}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{data.product.name}</h1>
      </div>
      <ProductImages productId={data.product.id} images={data.product.images} imageUrls={data.imageUrls} locale={locale} />
      {data.inventory.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-brand-950">{getDictionary(locale).admin.productForm.stock}</h2>
          <InventoryTable rows={data.inventory} canAdjust={hasPermission(session, "inventory:adjust")} locale={locale} />
        </section>
      )}
      <ProductForm product={data.product} categories={data.categories} brands={data.brands} locale={locale} />
    </div>
  );
}
