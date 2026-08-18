import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { CategoriesManager } from "@/features/catalog/categories/components/categories-manager";
import { getLocale } from "@/lib/i18n/locale";
import { listAllCategories } from "@/services/catalog/list-categories";
import { requireSession } from "@/services/auth/session";

export default async function CategoriesPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let categories;
  try {
    categories = await listAllCategories(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!categories) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return <CategoriesManager categories={categories} canManage={hasPermission(session, "categories:create")} locale={locale} />;
}
