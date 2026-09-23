"use client";

import Link from "next/link";
import { getContracts } from "@/lib/api";
import { useEffect, useState } from "react";

type Contract = { id: string; filename: string; status: string };

export default function ChatIndexPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContracts().then((d) => { setContracts(d.filter((c: Contract) => c.status === "completed")); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span><span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💬</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "8px" }}>Chat IA</h1>
        <p style={{ fontSize: "0.82rem", color: "#64748b", maxWidth: "360px", margin: "0 auto 28px", lineHeight: 1.6 }}>
          Seleccioná un contrato analizado para comenzar a consultarle preguntas con IA.
        </p>

        {loading ? (
          <div style={{ color: "#64748b", fontSize: "0.8rem" }}>Cargando contratos…</div>
        ) : contracts.length === 0 ? (
          <div>
            <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "16px" }}>No hay contratos analizados aún.</p>
            <Link href="/dashboard/upload" className="btn-primary">Subir y analizar contrato</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "480px", margin: "0 auto" }}>
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/contracts/${c.id}/chat`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px", borderRadius: "10px",
                  background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
                  textDecoration: "none", color: "#e2e8f0",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(20,184,166,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              >
                <span style={{ fontSize: "18px" }}>📄</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{c.filename}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#2dd4bf" }}>Consultar →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
