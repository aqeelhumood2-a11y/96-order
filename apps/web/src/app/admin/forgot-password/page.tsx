import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/features/admin-auth/components/forgot-password-form";
import { getSession } from "@/services/auth/session";

export default async function AdminForgotPasswordPage() {
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Reset your password</h1>
      <ForgotPasswordForm />
      <Link href="/admin/login" className="text-sm text-brand-700 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
