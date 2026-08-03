"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/ui/primitives/button";

export function ResendVerificationButton({ action }: { action: () => Promise<ActionResult<null>> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await action();
      setMessage(result.ok ? "Verification email sent." : result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Resend verification email"}
      </Button>
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </div>
  );
}
