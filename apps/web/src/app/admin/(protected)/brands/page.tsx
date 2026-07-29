import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { BrandsManager } from "@/features/catalog/brands/components/brands-manager";
import { listBrands } from "@/services/catalog/list-brands";
import { requireSession } from "@/services/auth/session";

export default async function BrandsPage() {
  const session = await requireSession();

  let brandsPage;
  try {
    brandsPage = await listBrands(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!brandsPage) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return <BrandsManager brands={brandsPage.items} canManage={hasPermission(session, "brands:create")} />;
}
