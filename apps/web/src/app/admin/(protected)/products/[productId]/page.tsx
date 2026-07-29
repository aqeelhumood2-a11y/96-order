import { notFound } from "next/navigation";
import type { Brand, Category, Product } from "@/core/catalog/entities";
import { ForbiddenError } from "@/core/errors";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { ProductImages } from "@/features/catalog/products/components/product-images";
import { listAllCategories } from "@/services/catalog/list-categories";
import { listBrands } from "@/services/catalog/list-brands";
import { getProduct } from "@/services/catalog/list-products";
import { getProductImageUrls } from "@/services/catalog/product-image-urls";
import { requirePermission, requireSession } from "@/services/auth/session";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const session = await requireSession();

  let data: { product: Product; categories: Category[]; brands: Brand[]; imageUrls: Record<string, string> } | null = null;
  let forbidden = false;
  try {
    requirePermission(session, "products:edit");

    const [product, categories, brandsPage] = await Promise.all([
      getProduct(session, productId),
      listAllCategories(session),
      listBrands(session, { limit: 100 }),
    ]);

    if (product) {
      const imageUrls = await getProductImageUrls(session, product);
      data = { product, categories, brands: brandsPage.items, imageUrls };
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      forbidden = true;
    } else {
      throw error;
    }
  }

  if (forbidden) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }
  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{data.product.name}</h1>
      <ProductImages productId={data.product.id} images={data.product.images} imageUrls={data.imageUrls} />
      <ProductForm product={data.product} categories={data.categories} brands={data.brands} />
    </div>
  );
}
