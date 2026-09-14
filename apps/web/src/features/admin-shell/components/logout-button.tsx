"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function LogoutButton({ children, locale = DEFAULT_LOCALE }: { children?: string; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? dict.signingOut : (children ?? dict.signOut)}
    </Button>
  );
}
