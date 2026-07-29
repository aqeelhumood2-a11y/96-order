"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { PERMISSION_ACTIONS, PERMISSION_NAMESPACES, formatPermission } from "@/core/auth/permissions";
import { createRoleAction } from "@/features/roles/actions";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

const formSchema = z.object({
  id: z
    .string()
    .min(1, "Role id is required.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only."),
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
});

export function RoleForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function togglePermission(permission: string) {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = formSchema.safeParse({ id, name, description });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setFieldError(null);

    setIsSubmitting(true);
    try {
      const result = await createRoleAction({ ...parsed.data, permissions });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setId("");
      setName("");
      setDescription("");
      setPermissions([]);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-id">Role id</Label>
          <Input id="role-id" value={id} onChange={(event) => setId(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-name">Name</Label>
          <Input id="role-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {fieldError && (
        <p role="alert" className="text-sm text-red-600">
          {fieldError}
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-foreground">Permissions</legend>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr>
                <th className="pr-4 text-left font-medium text-foreground/60">Namespace</th>
                {PERMISSION_ACTIONS.map((action) => (
                  <th key={action} className="px-2 text-left font-medium text-foreground/60">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_NAMESPACES.map((namespace) => (
                <tr key={namespace}>
                  <td className="pr-4 py-1">{namespace}</td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const permission = formatPermission(namespace, action);
                    return (
                      <td key={permission} className="px-2 py-1">
                        <input
                          type="checkbox"
                          aria-label={permission}
                          checked={permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          disabled={isSubmitting}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Creating…" : "Create role"}
      </Button>
    </form>
  );
}
