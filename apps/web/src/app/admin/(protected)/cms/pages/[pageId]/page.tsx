import Link from "next/link";
import { ForbiddenError } from "@/core/errors";
import { CmsPageForm } from "@/features/admin-cms/components/page-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCmsPage } from "@/services/cms/manage-pages";
import { requireSession } from "@/services/auth/session";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditCmsPagePage({ params }: PageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const { pageId } = await params;

  let page;
  try {
    page = await getCmsPage(session, pageId);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/cms/pages" className="text-sm text-brand-700 hover:underline">
          {getDictionary(locale).admin.cmsPagesPage.backToPages}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{getDictionary(locale).admin.cmsPagesPage.editPage}</h1>
      </div>
      <CmsPageForm existing={page} locale={locale} />
    </div>
  );
}
