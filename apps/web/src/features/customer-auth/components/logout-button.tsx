"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/primitives/button";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/customer-auth/session", { method: "DELETE" });
      router.push("/account/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? "Signing out…" : "Sign out"}
    </Button>
  );
}
