import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { InventoryTable } from "@/features/catalog/inventory/components/inventory-table";
import { listInventoryOverview } from "@/services/catalog/inventory-overview";
import { requireSession } from "@/services/auth/session";

export default async function InventoryPage() {
  const session = await requireSession();

  let rows;
  try {
    rows = await listInventoryOverview(session, { limit: 50 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!rows) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Inventory</h1>
      <InventoryTable rows={rows} canAdjust={hasPermission(session, "inventory:adjust")} />
    </div>
  );
}
