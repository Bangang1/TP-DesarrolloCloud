import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">📄</span>
          <h1 className="text-2xl font-bold gradient-text mt-2">ContractAI</h1>
          <p className="text-gray-400 text-sm mt-1">Crea tu cuenta gratis</p>
        </div>
        <SignUp fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
