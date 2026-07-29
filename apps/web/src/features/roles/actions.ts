"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createRole } from "@/services/auth/create-role";
import { deleteRole } from "@/services/auth/delete-role";
import { requireSession } from "@/services/auth/session";
import { updateRole } from "@/services/auth/update-role";

export async function createRoleAction(input: {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await createRole(actor, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/roles");
  return result;
}

export async function updateRoleAction(
  roleId: string,
  input: { name?: string; description?: string; permissions?: string[] },
): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await updateRole(actor, roleId, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/roles");
  return result;
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await deleteRole(actor, roleId);
    return null;
  });
  if (result.ok) revalidatePath("/admin/roles");
  return result;
}
