import { ForbiddenError } from "@/core/errors";
import type { QuestionStatus } from "@/core/questions/entities";
import { QUESTION_STATUSES } from "@/core/questions/entities";
import { CursorPagination } from "@/features/admin-shell/components/cursor-pagination";
import { AdminQuestionsTable } from "@/features/admin-questions/components/questions-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { parseCursorState } from "@/lib/cursor-pagination";
import { adminListQuestions } from "@/services/questions/list-questions";
import { requireSession } from "@/services/auth/session";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 20;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminQuestionsPage({ searchParams }: PageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const raw = await searchParams;
  const cursor = firstValue(raw.cursor);
  const cursorsParam = firstValue(raw.cursors);
  const statusParam = firstValue(raw.status);
  const status = statusParam && (QUESTION_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as QuestionStatus) : undefined;

  let page;
  try {
    page = await adminListQuestions(session, { limit: PAGE_SIZE, cursor, status });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const cursorState = parseCursorState(cursor, cursorsParam);
  const baseQueryString = status ? `status=${status}` : "";
  const dict = getDictionary(locale).admin.questionsPage;
  const questionStatusDict = getDictionary(locale).admin.questionStatus;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
      <div className="flex gap-2 text-sm">
        <a href="/admin/questions" className={!status ? "font-semibold text-brand-950" : "text-brand-700"}>
          {dict.all}
        </a>
        {QUESTION_STATUSES.map((value) => (
          <a key={value} href={`/admin/questions?status=${value}`} className={status === value ? "font-semibold text-brand-950" : "text-brand-700"}>
            {questionStatusDict[value]}
          </a>
        ))}
      </div>
      <AdminQuestionsTable questions={page.items} locale={locale} />
      <CursorPagination basePath="/admin/questions" baseQueryString={baseQueryString} cursorState={cursorState} nextCursor={page.nextCursor} locale={locale} />
    </div>
  );
}
