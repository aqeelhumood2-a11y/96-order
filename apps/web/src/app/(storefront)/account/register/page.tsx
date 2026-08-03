import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/features/customer-auth/components/register-form";
import { getCustomerSession } from "@/services/customer-auth/session";

export default async function CustomerRegisterPage() {
  const session = await getCustomerSession();
  if (session) {
    redirect("/account");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Create your account</h1>
      <CustomerRegisterForm />
      <p className="text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/account/login" className="text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
