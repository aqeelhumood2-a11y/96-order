import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/admin-auth/components/login-form";
import { getSession } from "@/services/auth/session";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Admin sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <Link href="/admin/forgot-password" className="text-sm text-brand-700 hover:underline">
        Forgot your password?
      </Link>
    </main>
  );
}
