"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type { Role } from "@/core/auth/entities";
import { createStaffAction } from "@/features/staff/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

const formSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  displayName: z.string().optional(),
});

export function CreateStaffForm({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = formSchema.safeParse({ email, displayName: displayName || undefined });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setFieldError(null);

    setIsSubmitting(true);
    try {
      const result = await createStaffAction({
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        roleIds: selectedRoleIds,
      });

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setSuccessMessage(`Staff account created for ${parsed.data.email}. A password-setup email has been sent.`);
      setEmail("");
      setDisplayName("");
      setSelectedRoleIds([]);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-staff-email">Email</Label>
        <Input
          id="new-staff-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldError)}
          disabled={isSubmitting}
        />
        {fieldError && (
          <p role="alert" className="text-sm text-red-600">
            {fieldError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-staff-name">Display name (optional)</Label>
        <Input
          id="new-staff-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-foreground">Roles</legend>
        {roles.length === 0 && <p className="text-sm text-foreground/60">No roles exist yet.</p>}
        {roles.map((role) => (
          <label key={role.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => toggleRole(role.id)}
              disabled={isSubmitting}
            />
            {role.name}
          </label>
        ))}
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      {successMessage && (
        <p role="status" className="text-sm text-foreground/70">
          {successMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create staff account"}
      </Button>
    </form>
  );
}
