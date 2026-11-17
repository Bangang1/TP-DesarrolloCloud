"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-teal-400/60 focus:bg-white/[0.07]";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos",
  email_not_confirmed: "Todavía no confirmaste tu email. Revisá tu casilla.",
  user_already_exists: "Ya existe una cuenta con ese email",
  weak_password: "La contraseña es demasiado débil",
  over_email_send_rate_limit: "Se enviaron demasiados emails. Probá de nuevo en unos minutos.",
  signup_disabled: "El registro está deshabilitado",
};

function errorMessage(error: { code?: string; message: string }) {
  return (error.code && ERROR_MESSAGES[error.code]) || error.message;
}

export default function AuthForm({ mode, notice }: { mode: "sign-in" | "sign-up"; notice?: string }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(notice ?? null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = () => `${window.location.origin}/auth/callback`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: callbackUrl() },
      });
      if (error) {
        setError(errorMessage(error));
      } else if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      } else if (data.user?.identities?.length === 0) {
        // Supabase no devuelve error para emails ya registrados cuando exige confirmacion.
        setError(ERROR_MESSAGES.user_already_exists);
      } else {
        setInfo(`Te enviamos un email a ${email}. Abrí el enlace para confirmar tu cuenta.`);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setError(errorMessage(error));
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) setError(errorMessage(error));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.jpg" alt="Suchus" width={48} height={48} className="rounded-full mx-auto" style={{ objectFit: "cover" }} />
          <h1 className="text-2xl font-bold gradient-text mt-3">Suchus Contract AI</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isSignUp ? "Creá tu cuenta" : "Iniciá sesión para continuar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 flex flex-col gap-4">
          {isSignUp && (
            <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-300">
              Nombre
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Tu nombre" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-300">
            Email
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="vos@ejemplo.com" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-300">
            Contraseña
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignUp ? 8 : undefined}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder={isSignUp ? "Mínimo 8 caracteres" : "••••••••"}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-lg border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-xs text-teal-300">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg border border-teal-400/40 bg-teal-400/10 py-2.5 text-sm font-semibold text-teal-300 transition hover:bg-teal-400/20 disabled:opacity-50"
          >
            {loading ? "Procesando…" : isSignUp ? "Crear cuenta" : "Ingresar"}
          </button>

          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="h-px flex-1 bg-white/10" />o<span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
          >
            Continuar con Google
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-5">
          {isSignUp ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="text-teal-400 hover:underline">
            {isSignUp ? "Iniciá sesión" : "Registrate"}
          </Link>
        </p>
      </div>
    </div>
  );
}
