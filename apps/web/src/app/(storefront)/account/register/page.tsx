import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/features/customer-auth/components/register-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCustomerSession } from "@/services/customer-auth/session";

export default async function CustomerRegisterPage() {
  const [session, locale] = await Promise.all([getCustomerSession(), getLocale()]);
  if (session) {
    redirect("/account");
  }
  const dict = getDictionary(locale).storefront.account;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.pages.createYourAccount}</h1>
      <CustomerRegisterForm locale={locale} />
      <p className="text-sm text-foreground/70">
        {dict.pages.alreadyHaveAccount}{" "}
        <Link href="/account/login" className="text-brand-700 hover:underline">
          {dict.login.signIn}
        </Link>
      </p>
    </div>
  );
}
