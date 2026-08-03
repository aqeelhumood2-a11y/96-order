import { CustomerForgotPasswordForm } from "@/features/customer-auth/components/forgot-password-form";

export default function CustomerForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Reset your password</h1>
      <CustomerForgotPasswordForm />
    </div>
  );
}
