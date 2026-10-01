"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d18] relative overflow-hidden px-4">
      {/* Fondos decorativos */}
      <div className="glow-teal-blob w-[400px] h-[400px] -top-32 -right-32 opacity-25 pointer-events-none" />
      <div className="glow-teal-blob w-[350px] h-[350px] bottom-0 left-0 opacity-20 bg-teal-500 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
              ⚖️
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-white">
            Crear cuenta en <span className="gradient-text">ContractAI</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Registrate gratis y empezá a auditar contratos
          </p>
        </div>

        {/* Card de registro */}
        <div className="glass-card p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6 fade-in">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
                📧
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                ¡Revisá tu email!
              </h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Te enviamos un link de confirmación a{" "}
                <strong className="text-teal-300">{email}</strong>. Hacé clic
                en el enlace para activar tu cuenta.
              </p>
              <Link
                href="/sign-in"
                className="btn-ghost text-sm py-2 px-5 inline-flex"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <>
              {/* Botones OAuth */}
              <div className="space-y-2.5 mb-6">
                <button
                  onClick={handleGoogleSignUp}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm font-medium text-gray-200 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Registrarse con Google
                </button>

              </div>

              {/* Separador */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  o con email
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Form email/password */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-colors"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glow w-full py-2.5 text-sm font-bold justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando cuenta...
                    </span>
                  ) : (
                    "Crear Cuenta"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Link a login */}
          {!success && (
            <p className="text-center text-xs text-gray-400 mt-5">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/sign-in"
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          )}
        </div>


      </div>
    </div>
  );
}
