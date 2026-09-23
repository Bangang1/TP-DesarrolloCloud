/**
 * Cliente HTTP para comunicarse con el backend FastAPI.
 * Incluye automaticamente el token de Clerk en cada request.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  // En el cliente, obtenemos el token de Clerk
  if (typeof window !== "undefined") {
    const { Clerk } = window as typeof window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
    const token = await Clerk?.session?.getToken();
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

export async function uploadContract(file: File) {
  const { Clerk } = window as typeof window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
  const token = await Clerk?.session?.getToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/contracts/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getContracts() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/`, { headers });
  if (!res.ok) throw new Error("Error al obtener contratos");
  return res.json();
}

export async function getContract(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/${id}`, { headers });
  if (!res.ok) throw new Error("Contrato no encontrado");
  return res.json();
}

export async function deleteContract(id: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error("Error al eliminar contrato");
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(contractId: string, question: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contractId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getChatHistory(contractId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/chat/${contractId}/history`, { headers });
  if (!res.ok) throw new Error("Error al obtener historial");
  return res.json();
}
