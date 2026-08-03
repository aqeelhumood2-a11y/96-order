import { ForbiddenError } from "@/core/errors";
import { PromotionsList } from "@/features/admin-promotions/components/promotions-list";
import { listPromotions } from "@/services/promotions/manage-promotions";
import { requireSession } from "@/services/auth/session";

export default async function AdminPromotionsPage() {
  const session = await requireSession();

  let page;
  try {
    page = await listPromotions(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Promotions</h1>
      <PromotionsList promotions={page.items} />
    </div>
  );
}
