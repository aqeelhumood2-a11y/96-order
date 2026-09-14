"use client";

import { useState } from "react";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label } from "@/ui/primitives";

export function CustomerForgotPasswordForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.forgotPassword;
  const formSchema = z.object({ email: z.string().min(1, dict.emailRequired).email(dict.enterValidEmail) });
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = formSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? dict.enterValidEmail);
      return;
    }
    setFieldError(null);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer-auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { code?: string } | null;
        setFormError(body?.code === "RATE_LIMITED" ? dict.rateLimited : dict.genericError);
        return;
      }

      setSuccessMessage(dict.successMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <p role="status" className="max-w-sm text-sm text-foreground/80">
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="forgot-email">{dict.email}</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "forgot-email-error" : undefined}
          disabled={isSubmitting}
        />
        {fieldError && (
          <p id="forgot-email-error" role="alert" className="text-sm text-danger-600">
            {fieldError}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? dict.sending : dict.sendResetLink}
      </Button>
    </form>
  );
}
