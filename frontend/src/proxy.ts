<<<<<<< HEAD
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
=======
/**
 * Proxy (ex middleware) de Supabase para refrescar sesiones y proteger rutas.
 * Reemplaza el anterior middleware de Clerk.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/sign-in", "/sign-up", "/auth/callback"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
<<<<<<< HEAD
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
=======
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
        },
      },
    }
  );

<<<<<<< HEAD
  // Valida el token (y lo renueva si vencio) antes de decidir.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  let target: string | null = null;
  if (pathname.startsWith("/dashboard") && !isLoggedIn) target = "/sign-in";
  if (AUTH_PAGES.includes(pathname) && isLoggedIn) target = "/dashboard";
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
=======
  // Refrescar la sesión si es necesario (mantiene la sesión activa)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si la ruta es protegida y el usuario no está autenticado, redirigir a sign-in
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Si el usuario está autenticado y está en sign-in o sign-up, redirigir al dashboard
  if (user && (request.nextUrl.pathname === "/sign-in" || request.nextUrl.pathname === "/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
