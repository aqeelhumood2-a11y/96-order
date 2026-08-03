import Link from "next/link";
import { ForbiddenError } from "@/core/errors";
import { CmsPagesTable } from "@/features/admin-cms/components/pages-table";
import { Button } from "@/ui/primitives/button";
import { listCmsPages } from "@/services/cms/manage-pages";
import { requireSession } from "@/services/auth/session";

export default async function AdminCmsPagesPage() {
  const session = await requireSession();

  let page;
  try {
    page = await listCmsPages(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">CMS pages</h1>
        <Button asChild size="sm">
          <Link href="/admin/cms/pages/new">New page</Link>
        </Button>
      </div>
      <CmsPagesTable pages={page.items} />
    </div>
  );
}
