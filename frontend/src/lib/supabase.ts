import { createBrowserClient } from "@supabase/ssr";

// La sesion se guarda en cookies, asi proxy.ts puede leerla en el servidor.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
