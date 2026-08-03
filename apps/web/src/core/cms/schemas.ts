import { z } from "zod";

export const cmsPageInputSchema = z.object({
  title: z.string().trim().min(1, "Please enter a title.").max(200),
  slug: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1, "Please add some content."),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(500).optional(),
  status: z.enum(["draft", "published"]),
  showInNav: z.boolean(),
  showInFooter: z.boolean(),
  sortOrder: z.number().int().min(0),
  /** Required on every update — the optimistic-concurrency guard (`core/cms/entities.ts#CmsPage.version`); absent when creating a new page. */
  expectedVersion: z.number().int().min(1).optional(),
});
export type CmsPageInput = z.infer<typeof cmsPageInputSchema>;
