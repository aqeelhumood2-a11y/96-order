import { randomUUID } from "node:crypto";
import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import type { Brand } from "@/core/catalog/entities";
import { type CreateBrandInput, createBrandSchema } from "@/core/catalog/schemas";
import { ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function createBrand(actor: Session, input: CreateBrandInput, deps: CatalogDeps = defaultCatalogDeps): Promise<Brand> {
  requirePermission(actor, "brands:create");
  const parsed = createBrandSchema.parse(input);
  const slug = parsed.slug ?? slugify(parsed.name);
  if (!slug) {
    throw new ValidationError("Could not derive a slug from this name — provide one explicitly.");
  }

  const now = new Date();
  const brand: Brand = {
    id: randomUUID(),
    name: parsed.name,
    slug,
    description: parsed.description,
    logoRef: parsed.logoRef,
    website: parsed.website,
    isActive: parsed.isActive,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };

  await deps.brands.create(brand);
  await deps.auditLogs.record({
    type: "brand_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { brandId: brand.id, slug },
  });

  return brand;
}
