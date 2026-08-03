"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/features/customer-auth/actions";
import { Button, Input, Label } from "@/ui/primitives";

export function ProfileForm({ fullName, mobile }: { fullName: string; mobile?: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(mobile ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const result = await updateProfileAction({ fullName: name, mobile: phone || undefined });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage("Profile updated.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Full name</Label>
        <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-mobile">Mobile</Label>
        <Input id="profile-mobile" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={isSubmitting} placeholder="36001234" />
      </div>
      {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
      {message && <p role="status" className="text-sm text-foreground/70">{message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
