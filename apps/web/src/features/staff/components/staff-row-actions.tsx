"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  initiatePasswordResetAction,
  revokeStaffSessionsAction,
  setStaffStatusAction,
} from "@/features/staff/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function StaffRowActions({
  uid,
  status,
  canEdit,
  locale = DEFAULT_LOCALE,
}: {
  uid: string;
  status: "active" | "deactivated";
  canEdit: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.staffPage;
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!canEdit) return null;

  async function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setIsPending(true);
    setMessage(null);
    try {
      const result = await action();
      if (!result.ok) {
        setMessage(result.message ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run(() => setStaffStatusAction(uid, status === "active" ? "deactivated" : "active"))}
      >
        {status === "active" ? dict.deactivate : dict.activate}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => run(() => revokeStaffSessionsAction(uid))}
      >
        {dict.forceLogout}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={async () => {
          setIsPending(true);
          setMessage(null);
          setStatusMessage(null);
          try {
            const result = await initiatePasswordResetAction(uid);
            if (result.ok) {
              setStatusMessage(dict.passwordResetSent);
            } else {
              setMessage(result.message);
            }
          } finally {
            setIsPending(false);
          }
        }}
      >
        {dict.resetPassword}
      </Button>
      {message && (
        <p role="alert" className="text-xs text-danger-600">
          {message}
        </p>
      )}
      {statusMessage && (
        <p role="status" className="text-xs text-foreground/70">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
