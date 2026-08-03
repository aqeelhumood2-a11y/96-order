import { ForbiddenError } from "@/core/errors";
import { CmsPageForm } from "@/features/admin-cms/components/page-form";
import { getCmsPage } from "@/services/cms/manage-pages";
import { requireSession } from "@/services/auth/session";

interface PageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditCmsPagePage({ params }: PageProps) {
  const session = await requireSession();
  const { pageId } = await params;

  let page;
  try {
    page = await getCmsPage(session, pageId);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Edit page</h1>
      <CmsPageForm existing={page} />
    </div>
  );
}
