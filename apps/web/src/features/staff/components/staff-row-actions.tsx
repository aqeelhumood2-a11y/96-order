"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  initiatePasswordResetAction,
  revokeStaffSessionsAction,
  setStaffStatusAction,
} from "@/features/staff/actions";
import { Button } from "@/ui/primitives/button";

export function StaffRowActions({
  uid,
  status,
  canEdit,
}: {
  uid: string;
  status: "active" | "deactivated";
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

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
        {status === "active" ? "Deactivate" : "Activate"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => run(() => revokeStaffSessionsAction(uid))}
      >
        Force logout
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={async () => {
          setIsPending(true);
          setMessage(null);
          try {
            const result = await initiatePasswordResetAction(uid);
            if (result.ok) {
              setResetLink(result.data.link);
            } else {
              setMessage(result.message);
            }
          } finally {
            setIsPending(false);
          }
        }}
      >
        Reset password
      </Button>
      {message && (
        <p role="alert" className="text-xs text-red-600">
          {message}
        </p>
      )}
      {resetLink && (
        <p className="w-full break-all text-xs text-foreground/70">
          Reset link (share with the staff member — no email is sent automatically):{" "}
          <span className="font-mono">{resetLink}</span>
        </p>
      )}
    </div>
  );
}
