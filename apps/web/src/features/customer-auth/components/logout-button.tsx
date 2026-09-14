"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function CustomerLogoutButton({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.logout;
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
      {isSubmitting ? dict.signingOut : dict.signOut}
    </Button>
  );
}
