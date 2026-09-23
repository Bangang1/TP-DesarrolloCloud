import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">📄</span>
          <h1 className="text-2xl font-bold gradient-text mt-2">ContractAI</h1>
        </div>
        <SignIn fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
