/**
 * Cliente Supabase para el lado del servidor (Server Components, Route Handlers, Server Actions).
 * Maneja cookies automáticamente para sesiones persistentes.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll puede fallar si se llama desde un Server Component
            // (solo funciona en Server Actions o Route Handlers)
          }
        },
      },
    }
  );
}
