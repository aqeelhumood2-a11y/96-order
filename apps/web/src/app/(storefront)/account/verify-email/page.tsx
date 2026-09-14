import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { verifyCustomerEmail } from "@/services/customer-auth/verify-email";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * A Server Component that performs the verification directly on render —
 * the only "mutation on GET" in this codebase, justified because it's
 * always a deliberate, user-initiated click on a one-time emailed link,
 * and `verifyCustomerEmail` is itself idempotent-safe (a second visit to
 * the same link just fails cleanly with "invalid or expired," never
 * double-applies anything) — see that function's doc comment.
 */
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const locale = await getLocale();
  const dict = getDictionary(locale).storefront.account.pages;

  if (!token) {
    return <VerifyEmailResult heading={dict.verificationLinkMissingHeading} message={dict.verificationLinkMissingMessage} />;
  }

  let verified = true;
  try {
    await verifyCustomerEmail(token);
  } catch {
    verified = false;
  }

  return verified ? (
    <VerifyEmailResult heading={dict.emailVerifiedHeading} message={dict.emailVerifiedMessage}>
      <Link href="/account" className="text-sm text-brand-700 hover:underline">
        {dict.goToYourAccount}
      </Link>
    </VerifyEmailResult>
  ) : (
    <VerifyEmailResult heading={dict.verificationLinkInvalidHeading} message={dict.verificationLinkInvalidMessage}>
      <Link href="/account" className="text-sm text-brand-700 hover:underline">
        {dict.goToAccountRequestNew}
      </Link>
    </VerifyEmailResult>
  );
}

function VerifyEmailResult({ heading, message, children }: { heading: string; message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{heading}</h1>
      <p className="text-sm text-foreground/70">{message}</p>
      {children}
    </div>
  );
}
