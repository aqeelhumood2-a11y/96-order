import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/features/customer-auth/components/login-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCustomerSession } from "@/services/customer-auth/session";

export default async function CustomerLoginPage() {
  const [session, locale] = await Promise.all([getCustomerSession(), getLocale()]);
  if (session) {
    redirect("/account");
  }
  const dict = getDictionary(locale).storefront.account;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.pages.signIn}</h1>
      <Suspense>
        <CustomerLoginForm locale={locale} />
      </Suspense>
      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/account/forgot-password" className="text-brand-700 hover:underline">
          {dict.pages.forgotYourPassword}
        </Link>
        <p className="text-foreground/70">
          {dict.pages.newHere}{" "}
          <Link href="/account/register" className="text-brand-700 hover:underline">
            {dict.pages.createAnAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
