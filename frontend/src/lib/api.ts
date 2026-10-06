/**
 * Cliente HTTP para comunicarse con el backend FastAPI.
 * Incluye automáticamente el token de Supabase en cada request.
 */
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  // En el cliente, obtenemos el token de Supabase
  if (typeof window !== "undefined") {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    }
  }
  return { "Content-Type": "application/json" };
}

// ─── Contratos ───────────────────────────────────────────────────────────────

/**
 * Registra un contrato (ya subido a Firebase Storage) en el backend
 * y dispara el análisis de IA en segundo plano.
 */
export async function registrarContrato(usuarioId: string, contratoUrl: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/contratos/analizar`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      usuario_id: usuarioId,
      contrato_url: contratoUrl,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getContratos() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/`, { headers });
  if (!res.ok) throw new Error("Error al obtener contratos");
  return res.json();
}

export async function getContrato(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/${id}`, { headers });
  if (!res.ok) throw new Error("Contrato no encontrado");
  return res.json();
}

export async function deleteContrato(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Error al eliminar contrato");
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(contratoId: string, question: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contratoId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getChatHistory(contratoId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contratoId}/history`, { headers });
  if (!res.ok) throw new Error("Error al obtener historial");
  return res.json();
}
