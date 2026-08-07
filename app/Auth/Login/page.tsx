import { LanyardStage } from "./_Components/LanyardStage";
import { LoginForm } from "./_Components/LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-gradient grid min-h-screen flex-1 lg:grid-cols-2">
      {/* Left panel — 3D lanyard card. */}
      <div className="relative hidden h-screen lg:block">
        <LanyardStage />
        <div className="auth-divider absolute inset-y-0 right-0 w-px" />
      </div>

      {/* Right panel — login. */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="auth-card w-full max-w-[380px] rounded-2xl p-8">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-medium text-balance text-auth-fg">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-pretty text-auth-label">
              Sign in your account
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
