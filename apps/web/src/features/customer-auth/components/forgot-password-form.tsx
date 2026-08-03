"use client";

import { useState } from "react";
import { z } from "zod";
import { Button, Input, Label } from "@/ui/primitives";

const formSchema = z.object({ email: z.string().min(1, "Email is required.").email("Enter a valid email address.") });
const GENERIC_SUCCESS_MESSAGE = "If an account exists for this email, a password reset email has been sent.";

export function CustomerForgotPasswordForm() {
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
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
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
        setFormError(body?.code === "RATE_LIMITED" ? "Too many requests. Please try again shortly." : "Something went wrong. Please try again.");
        return;
      }

      setSuccessMessage(GENERIC_SUCCESS_MESSAGE);
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
        <Label htmlFor="forgot-email">Email</Label>
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
          <p id="forgot-email-error" role="alert" className="text-sm text-red-600">
            {fieldError}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
