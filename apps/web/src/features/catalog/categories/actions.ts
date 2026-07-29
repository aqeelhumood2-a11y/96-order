"use server";

import { revalidatePath } from "next/cache";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/core/catalog/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createCategory } from "@/services/catalog/create-category";
import { deleteCategory } from "@/services/catalog/delete-category";
import { updateCategory } from "@/services/catalog/update-category";
import { requireSession } from "@/services/auth/session";

export async function createCategoryAction(input: CreateCategoryInput): Promise<ActionResult<{ id: string }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const category = await createCategory(actor, input);
    return { id: category.id };
  });
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function updateCategoryAction(categoryId: string, input: UpdateCategoryInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await updateCategory(actor, categoryId, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await deleteCategory(actor, categoryId);
    return null;
  });
  if (result.ok) revalidatePath("/admin/categories");
  return result;
}
