"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { assignRoles } from "@/services/auth/assign-roles";
import { createStaff } from "@/services/auth/create-staff";
import { initiatePasswordReset } from "@/services/auth/initiate-password-reset";
import { requireSession } from "@/services/auth/session";
import { revokeStaffSessions } from "@/services/auth/revoke-staff-sessions";
import { setStaffStatus } from "@/services/auth/set-staff-status";

export async function createStaffAction(input: {
  email: string;
  displayName?: string;
  roleIds: string[];
}): Promise<ActionResult<{ uid: string }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    return createStaff(actor, input);
  });
  if (result.ok) revalidatePath("/admin/staff");
  return result;
}

export async function setStaffStatusAction(targetUid: string, status: "active" | "deactivated"): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await setStaffStatus(actor, targetUid, status);
    return null;
  });
  if (result.ok) revalidatePath("/admin/staff");
  return result;
}

export async function assignRolesAction(targetUid: string, roleIds: string[]): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await assignRoles(actor, targetUid, roleIds);
    return null;
  });
  if (result.ok) revalidatePath("/admin/staff");
  return result;
}

export async function revokeStaffSessionsAction(targetUid: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const actor = await requireSession();
    await revokeStaffSessions(actor, targetUid);
    return null;
  });
}

export async function initiatePasswordResetAction(targetUid: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const actor = await requireSession();
    await initiatePasswordReset(actor, targetUid);
    return null;
  });
}
