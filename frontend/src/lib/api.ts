/**
 * Cliente HTTP para comunicarse con el backend FastAPI.
 * Incluye automaticamente el token de la sesion de Supabase en cada request.
 */

import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export async function uploadContract(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await request("/contracts/", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await errorDetail(res, "Error al subir el contrato"));
  return res.json();
}

export async function getContracts() {
  const res = await request("/contracts/");
  if (!res.ok) throw new Error("Error al obtener contratos");
  return res.json();
}

export async function getContract(id: string) {
  const res = await request(`/contracts/${id}`);
  if (!res.ok) throw new Error("Contrato no encontrado");
  return res.json();
}

export async function deleteContract(id: string) {
  const res = await request(`/contracts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar contrato");
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(contractId: string, question: string) {
  const res = await request(`/chat/${contractId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await errorDetail(res, "Error al enviar el mensaje"));
  return res.json();
}

export async function getChatHistory(contractId: string) {
  const res = await request(`/chat/${contractId}/history`);
  if (!res.ok) throw new Error("Error al obtener historial");
  return res.json();
}
