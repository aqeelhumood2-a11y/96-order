import { CmsPageForm } from "@/features/admin-cms/components/page-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export default async function NewCmsPagePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale).admin.cmsPagesPage;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.newPage}</h1>
      <CmsPageForm locale={locale} />
    </div>
  );
}
