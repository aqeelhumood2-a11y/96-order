import Link from "next/link";
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

  if (!token) {
    return <VerifyEmailResult heading="Verification link missing" message="This link is missing its verification code." />;
  }

  let verified = true;
  try {
    await verifyCustomerEmail(token);
  } catch {
    verified = false;
  }

  return verified ? (
    <VerifyEmailResult heading="Email verified" message="Your email address has been verified.">
      <Link href="/account" className="text-sm text-brand-700 hover:underline">
        Go to your account
      </Link>
    </VerifyEmailResult>
  ) : (
    <VerifyEmailResult heading="Verification link invalid" message="This verification link is invalid or has expired.">
      <Link href="/account" className="text-sm text-brand-700 hover:underline">
        Go to your account to request a new one
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
