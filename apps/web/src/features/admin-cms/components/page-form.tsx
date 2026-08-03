"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CmsPage } from "@/core/cms/entities";
import type { CmsPageInput } from "@/core/cms/schemas";
import { createCmsPageAction, updateCmsPageAction } from "@/features/admin-cms/actions";
import { Button, Input, Label, Select, Textarea } from "@/ui/primitives";

export function CmsPageForm({ existing }: { existing?: CmsPage }) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(existing?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(existing?.seoDescription ?? "");
  const [status, setStatus] = useState<CmsPageInput["status"]>(existing?.status ?? "draft");
  const [showInNav, setShowInNav] = useState(existing?.showInNav ?? false);
  const [showInFooter, setShowInFooter] = useState(existing?.showInFooter ?? true);
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input: CmsPageInput = {
        title,
        slug: slug || undefined,
        content,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        status,
        showInNav,
        showInFooter,
        sortOrder,
        expectedVersion: existing?.version,
      };
      const result = existing ? await updateCmsPageAction(existing.id, input) : await createCmsPageAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/admin/cms/pages");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Slug (optional — derived from the title if left blank)</Label>
        <Input value={slug} onChange={(event) => setSlug(event.target.value)} disabled={isSubmitting} placeholder="about-us" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Content</Label>
        <Textarea value={content} onChange={(event) => setContent(event.target.value)} disabled={isSubmitting} required rows={12} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>SEO title</Label>
          <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>SEO description</Label>
          <Input value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={status} onChange={(event) => setStatus(event.target.value as CmsPageInput["status"])} disabled={isSubmitting}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sort order</Label>
          <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} disabled={isSubmitting} min={0} />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={showInNav} onChange={(event) => setShowInNav(event.target.checked)} disabled={isSubmitting} />
          Show in header navigation
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={showInFooter} onChange={(event) => setShowInFooter(event.target.checked)} disabled={isSubmitting} />
          Show in footer
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
      <Button type="submit" size="sm" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving…" : existing ? "Save changes" : "Create page"}
      </Button>
    </form>
  );
}
