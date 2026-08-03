import { CmsPageForm } from "@/features/admin-cms/components/page-form";

export default function NewCmsPagePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">New page</h1>
      <CmsPageForm />
    </div>
  );
}
