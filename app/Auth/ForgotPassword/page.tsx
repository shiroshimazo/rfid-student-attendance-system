import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-gradient flex min-h-screen items-center justify-center px-6 py-16">
      <div className="auth-card w-full max-w-[420px] rounded-2xl p-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
