/**
 * Cliente HTTP para comunicarse con el backend FastAPI.
<<<<<<< HEAD
 * Incluye automaticamente el token de la sesion de Supabase en cada request.
=======
 * Incluye automáticamente el token de Supabase en cada request.
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
 */
import { createClient } from "@/lib/supabase/client";

import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

<<<<<<< HEAD
async function request(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.assign("/sign-in");
=======
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
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  }
  return res;
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) return body.detail.map((d: { msg: string }) => d.msg).join(", ");
  } catch {}
  return fallback;
}

// ─── Contratos ───────────────────────────────────────────────────────────────

<<<<<<< HEAD
export async function uploadContract(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await request("/contracts/", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await errorDetail(res, "Error al subir el contrato"));
=======
/**
 * Registra un contrato (ya subido a Azure Blob Storage) en el backend
 * y dispara el análisis de IA en segundo plano.
 * El usuario lo determina el backend a partir del token de Supabase.
 */
export async function registrarContrato(contratoUrl: string, nombreArchivo?: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/contratos/analizar`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contrato_url: contratoUrl,
      nombre_archivo: nombreArchivo,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  return res.json();
}

export async function getContracts() {
<<<<<<< HEAD
  const res = await request("/contracts/");
=======
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/`, { headers });
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  if (!res.ok) throw new Error("Error al obtener contratos");
  return res.json();
}

export async function getContract(id: string) {
<<<<<<< HEAD
  const res = await request(`/contracts/${id}`);
=======
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/${id}`, { headers });
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  if (!res.ok) throw new Error("Contrato no encontrado");
  return res.json();
}

export async function deleteContract(id: string) {
<<<<<<< HEAD
  const res = await request(`/contracts/${id}`, { method: "DELETE" });
=======
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/contratos/${id}`, {
    method: "DELETE",
    headers,
  });
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  if (!res.ok) throw new Error("Error al eliminar contrato");
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
export async function sendChatMessage(contractId: string, question: string) {
  const res = await request(`/chat/${contractId}`, {
=======
export async function sendChatMessage(contratoId: string, question: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contratoId}`, {
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await errorDetail(res, "Error al enviar el mensaje"));
  return res.json();
}

<<<<<<< HEAD
export async function getChatHistory(contractId: string) {
  const res = await request(`/chat/${contractId}/history`);
=======
export async function getChatHistory(contratoId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contratoId}/history`, { headers });
>>>>>>> 0ce61968b85cf9eb3a6b73c82235f46ce73236f6
  if (!res.ok) throw new Error("Error al obtener historial");
  return res.json();
}
