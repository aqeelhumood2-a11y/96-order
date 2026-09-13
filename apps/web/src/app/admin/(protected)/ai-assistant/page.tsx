import { ForbiddenError } from "@/core/errors";
import { AiAssistantPanel } from "@/features/admin-ai-assistant/components/ai-assistant-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requirePermission, requireSession } from "@/services/auth/session";

export default async function AiAssistantPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  try {
    requirePermission(session, "reports:view");
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const dict = getDictionary(locale).admin.aiAssistantPage;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <p className="mt-1 text-sm text-foreground/69">{dict.subheading}</p>
      </div>
      <AiAssistantPanel locale={locale} />
    </div>
  );
}
