"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { sendChatMessage, getChatHistory } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

const SUGGESTED = [
  "¿Cuándo vence el contrato?",
  "¿Cómo puedo rescindirlo?",
  "¿Qué cláusulas presentan riesgos?",
];

export default function ChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await getChatHistory(params.id);
      setMessages(data.messages ?? []);
    } catch { /* no-op */ }
    finally { setHistLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: q, timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await sendChatMessage(params.id, q);
      const aiMsg: Message = { role: "assistant", content: res.answer, timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Error al obtener respuesta. Verificá que el análisis esté completo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span><span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      {/* Contract active banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
            background: "rgba(20,184,166,0.1)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)",
          }}>CONTRATO ACTIVO</span>
          <span style={{ fontSize: "0.65rem", color: "#64748b" }}>● Indexado (RAG v2.4)</span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
            Contrato de Servicios — Empresa XYZ
          </span>
        </div>
        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>📄 48 Páginas · 142 Vectores semánticos</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
          AUDITORÍA AUMENTADA · Búsqueda Semántica Vectorial
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "4px" }}>Preguntale a tu contrato</h1>
        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
          Consultá cualquier información del documento analizado mediante búsqueda semántica con citas directas verificadas.
        </p>
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && !histLoading && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                padding: "6px 12px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 500,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(20,184,166,0.35)"; e.currentTarget.style.color = "#2dd4bf"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              📌 {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "8px" }}>
        {histLoading && (
          <div style={{ textAlign: "center", color: "#64748b", padding: "20px", fontSize: "0.78rem" }}>Cargando historial…</div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: "10px", alignItems: "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>
                ✦
              </div>
            )}
            <div style={{ maxWidth: "70%" }}>
              <div style={{
                fontSize: "0.6rem", color: "#64748b", marginBottom: "4px",
                textAlign: m.role === "user" ? "right" : "left",
              }}>
                {m.role === "user" ? "Lucas M. [Auditor]" : "Suchus IA · Respaldo Semántico"}
                {m.timestamp && <span style={{ marginLeft: "6px" }}>· {m.timestamp}</span>}
              </div>
              <div style={{
                padding: "12px 14px", borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                background: m.role === "user" ? "rgba(99,102,241,0.15)" : "#111827",
                border: m.role === "user" ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.07)",
                fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.65,
              }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✦</div>
            <div style={{ padding: "12px 14px", borderRadius: "4px 12px 12px 12px", background: "#111827", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map((j) => (
                  <div key={j} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2dd4bf", animation: `pulse-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px", marginTop: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", flexShrink: 0 }}>🔍</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Escribí tu pregunta sobre este contrato…"
            disabled={loading}
            style={{
              flex: 1, padding: "10px 14px",
              background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px", color: "#e2e8f0", fontSize: "0.82rem",
              outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(20,184,166,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              padding: "10px 18px",
              background: input.trim() && !loading ? "linear-gradient(135deg, #14b8a6, #6366f1)" : "rgba(255,255,255,0.05)",
              border: "none", borderRadius: "8px",
              color: input.trim() && !loading ? "white" : "#374151",
              fontSize: "0.8rem", fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            Consultar ▶
          </button>
        </div>
        <div style={{ fontSize: "0.62rem", color: "#374151", marginTop: "8px", textAlign: "center" }}>
          ✦ Demostración de sistema RAG con búsqueda semántica en documentos legales. · Presioná Enter para enviar.
        </div>
      </div>
    </div>
  );
}
