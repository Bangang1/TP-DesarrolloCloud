import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );

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
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
