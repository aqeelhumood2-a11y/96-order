import type { Session } from "@/core/auth/entities";
import type { Brand } from "@/core/catalog/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function listBrands(actor: Session, request: PageRequest, deps: CatalogDeps = defaultCatalogDeps): Promise<Page<Brand>> {
  requirePermission(actor, "brands:view");
  return deps.brands.list(request);
}

export async function getBrand(actor: Session, brandId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<Brand | null> {
  requirePermission(actor, "brands:view");
  return deps.brands.findById(brandId);
}
