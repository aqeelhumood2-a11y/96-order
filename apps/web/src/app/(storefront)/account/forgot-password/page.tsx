import { CustomerForgotPasswordForm } from "@/features/customer-auth/components/forgot-password-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export default async function CustomerForgotPasswordPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale).storefront.account;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.pages.resetYourPassword}</h1>
      <CustomerForgotPasswordForm locale={locale} />
    </div>
  );
}
