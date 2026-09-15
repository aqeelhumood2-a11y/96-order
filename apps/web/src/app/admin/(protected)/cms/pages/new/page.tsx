import Link from "next/link";
import { CmsPageForm } from "@/features/admin-cms/components/page-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export default async function NewCmsPagePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale).admin.cmsPagesPage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/cms/pages" className="text-sm text-brand-700 hover:underline">
          {dict.backToPages}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.newPage}</h1>
      </div>
      <CmsPageForm locale={locale} />
    </div>
  );
}
