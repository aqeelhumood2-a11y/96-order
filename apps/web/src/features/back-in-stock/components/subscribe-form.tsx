"use client";

import { useId, useState } from "react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label } from "@/ui/primitives";

export interface BackInStockSubscribeFormProps {
  productId: string;
  variantId: string | null;
  /** Set when the visitor is signed in — their account email is used and no input is shown. */
  signedInEmail?: string;
  locale?: Locale;
}

export function BackInStockSubscribeForm({ productId, variantId, signedInEmail, locale = DEFAULT_LOCALE }: BackInStockSubscribeFormProps) {
  const dict = getDictionary(locale).storefront.backInStock;
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/back-in-stock/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signedInEmail ?? email, productId, variantId }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        setMessage((body as { message?: string } | null)?.message ?? dict.genericError);
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage(dict.genericError);
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="text-sm text-brand-700">
        {dict.subscribedMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        {!signedInEmail && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={emailId}>{dict.emailMeLabel}</Label>
            <Input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === "loading"} required className="w-64" />
          </div>
        )}
        <Button type="submit" variant="outline" disabled={status === "loading"}>
          {status === "loading" ? dict.submitting : dict.notifyMe}
        </Button>
      </div>
      {status === "error" && message && (
        <p role="alert" className="text-xs text-danger-600">
          {message}
        </p>
      )}
    </form>
  );
}
