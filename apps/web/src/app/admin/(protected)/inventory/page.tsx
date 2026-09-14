import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { InventoryTable } from "@/features/catalog/inventory/components/inventory-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { listInventoryOverview } from "@/services/catalog/inventory-overview";
import { requireSession } from "@/services/auth/session";

export default async function InventoryPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let rows;
  try {
    rows = await listInventoryOverview(session, { limit: 50 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!rows) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{getDictionary(locale).admin.inventoryPage.heading}</h1>
      <InventoryTable rows={rows} canAdjust={hasPermission(session, "inventory:adjust")} locale={locale} />
    </div>
  );
}
