import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/features/customer-auth/components/login-form";
import { getCustomerSession } from "@/services/customer-auth/session";

export default async function CustomerLoginPage() {
  const session = await getCustomerSession();
  if (session) {
    redirect("/account");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Sign in</h1>
      <Suspense>
        <CustomerLoginForm />
      </Suspense>
      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/account/forgot-password" className="text-brand-700 hover:underline">
          Forgot your password?
        </Link>
        <p className="text-foreground/70">
          New here?{" "}
          <Link href="/account/register" className="text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
