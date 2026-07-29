import type { Session } from "@/core/auth/entities";
import type { Product } from "@/core/catalog/entities";
import type { ListProductsRequest } from "@/core/interfaces/product-repository";
import type { Page } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function listProducts(actor: Session, request: ListProductsRequest, deps: CatalogDeps = defaultCatalogDeps): Promise<Page<Product>> {
  requirePermission(actor, "products:view");
  return deps.products.list(request);
}

export async function getProduct(actor: Session, productId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<Product | null> {
  requirePermission(actor, "products:view");
  return deps.products.findById(productId);
}
