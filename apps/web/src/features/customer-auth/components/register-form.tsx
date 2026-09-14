"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label } from "@/ui/primitives";

type FieldErrors = Partial<Record<"fullName" | "email" | "password", string>>;

export function CustomerRegisterForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.register;
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    fullName: z.string().trim().min(2, dict.fullNameRequired),
    email: z.string().min(1, dict.emailRequired).email(dict.enterValidEmail),
    password: z.string().min(8, dict.passwordMinLength),
    marketingConsent: z.boolean(),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = formSchema.safeParse({ fullName, email, password, marketingConsent });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors | undefined;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
        setFormError(body?.code === "CONFLICT" ? dict.accountExists : (body?.message ?? dict.genericError));
        return;
      }

      router.push("/account");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name">{dict.fullName}</Label>
        <Input id="register-name" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.fullName)} />
        {fieldErrors.fullName && <p role="alert" className="text-sm text-danger-600">{fieldErrors.fullName}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">{dict.email}</Label>
        <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.email)} />
        {fieldErrors.email && <p role="alert" className="text-sm text-danger-600">{fieldErrors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">{dict.password}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="register-password-hint"
        />
        <p id="register-password-hint" className="text-xs text-foreground/69">{dict.passwordHint}</p>
        {fieldErrors.password && <p role="alert" className="text-sm text-danger-600">{fieldErrors.password}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground/80">
        <input type="checkbox" className="mt-0.5" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} disabled={isSubmitting} />
        {dict.marketingConsentLabel}
      </label>

      {formError && (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? dict.creatingAccount : dict.createAccount}
      </Button>
    </form>
  );
}
