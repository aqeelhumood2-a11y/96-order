"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label } from "@/ui/primitives";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function CustomerLoginForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    email: z.string().min(1, dict.emailRequired).email(dict.enterValidEmail),
    password: z.string().min(1, dict.passwordRequired),
  });

  function mapErrorMessage(code: string | undefined): string {
    switch (code) {
      case "RATE_LIMITED":
        return dict.rateLimited;
      case "UNAUTHORIZED":
        return dict.invalidCredentials;
      default:
        return dict.genericError;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = formSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "email" | "password" | undefined;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer-auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { code?: string } | null;
        setFormError(mapErrorMessage(body?.code));
        return;
      }

      const next = searchParams.get("next");
      router.push(next && next.startsWith("/account") ? next : "/account");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{dict.email}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          disabled={isSubmitting}
        />
        {fieldErrors.email && (
          <p id="login-email-error" role="alert" className="text-sm text-danger-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">{dict.password}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          disabled={isSubmitting}
        />
        {fieldErrors.password && (
          <p id="login-password-error" role="alert" className="text-sm text-danger-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? dict.signingIn : dict.signIn}
      </Button>
    </form>
  );
}
