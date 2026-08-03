"use server";

import { revalidatePath } from "next/cache";
import type { CmsPageInput } from "@/core/cms/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { createCmsPage, deleteCmsPage, updateCmsPage } from "@/services/cms/manage-pages";

export async function createCmsPageAction(input: CmsPageInput): Promise<ActionResult<{ id: string }>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    const page = await createCmsPage(session, input);
    return { id: page.id };
  });
  if (result.ok) revalidatePath("/admin/cms/pages");
  return result;
}

export async function updateCmsPageAction(id: string, input: CmsPageInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await updateCmsPage(session, id, input);
    return null;
  });
  if (result.ok) {
    revalidatePath("/admin/cms/pages");
    revalidatePath(`/admin/cms/pages/${id}`);
  }
  return result;
}

export async function deleteCmsPageAction(id: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await deleteCmsPage(session, id);
    return null;
  });
  if (result.ok) revalidatePath("/admin/cms/pages");
  return result;
}
