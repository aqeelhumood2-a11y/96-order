import Link from "next/link";
import { ForbiddenError } from "@/core/errors";
import { CmsPagesTable } from "@/features/admin-cms/components/pages-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { Button } from "@/ui/primitives/button";
import { listCmsPages } from "@/services/cms/manage-pages";
import { requireSession } from "@/services/auth/session";

export default async function AdminCmsPagesPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let page;
  try {
    page = await listCmsPages(session, { limit: 100 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const dict = getDictionary(locale).admin.cmsPagesPage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <Button asChild size="sm">
          <Link href="/admin/cms/pages/new">{dict.newPage}</Link>
        </Button>
      </div>
      <CmsPagesTable pages={page.items} locale={locale} />
    </div>
  );
}
