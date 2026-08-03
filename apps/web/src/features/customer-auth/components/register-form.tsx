"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button, Input, Label } from "@/ui/primitives";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  marketingConsent: z.boolean(),
});

type FieldErrors = Partial<Record<"fullName" | "email" | "password", string>>;

export function CustomerRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setFormError(body?.code === "CONFLICT" ? "An account with this email already exists." : body?.message ?? "Something went wrong. Please try again.");
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
        <Label htmlFor="register-name">Full name</Label>
        <Input id="register-name" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.fullName)} />
        {fieldErrors.fullName && <p role="alert" className="text-sm text-danger-600">{fieldErrors.fullName}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">Email</Label>
        <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(fieldErrors.email)} />
        {fieldErrors.email && <p role="alert" className="text-sm text-danger-600">{fieldErrors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">Password</Label>
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
        <p id="register-password-hint" className="text-xs text-foreground/69">At least 8 characters.</p>
        {fieldErrors.password && <p role="alert" className="text-sm text-danger-600">{fieldErrors.password}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground/80">
        <input type="checkbox" className="mt-0.5" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} disabled={isSubmitting} />
        Send me offers and promotions by email (optional — you can change this anytime in your account).
      </label>

      {formError && (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
