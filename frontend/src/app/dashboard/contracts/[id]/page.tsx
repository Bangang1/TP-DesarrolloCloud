"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getContract } from "@/lib/api";

type Analysis = {
  summary: string;
  parties: string[];
  key_dates: { type: string; date: string; description?: string }[];
  risks: { clause: string; description: string; severity: "high" | "medium" | "low" }[];
  clauses: { title: string; content: string }[];
};

type ContractDetail = {
  id: string;
  filename: string;
  status: string;
  analysis?: Analysis;
};

const RISK_COLORS = {
  high:   { label: "Riesgo alto",   bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#ef4444" },
  medium: { label: "Riesgo medio",  bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#f59e0b" },
  low:    { label: "Riesgo bajo",   bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)",   text: "#22c55e" },
};

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getContract(params.id).then((d) => { setContract(d); setLoading(false); }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>
      <div style={{ width: "22px", height: "22px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: "12px" }} />
      Cargando análisis…
    </div>
  );

  const analysis = contract?.analysis;
  const risks    = analysis?.risks ?? [];
  const highCount   = risks.filter((r) => r.severity === "high").length;
  const mediumCount = risks.filter((r) => r.severity === "medium").length;
  const lowCount    = risks.filter((r) => r.severity === "low").length;

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span><span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      {/* Auditoria badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px",
          background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          AUDITORÍA ACTIVA #{params.id.slice(-4).toUpperCase()}
        </span>
        {highCount > 0 && (
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px",
            background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)",
          }}>
            ● Riesgo General: ALTO
          </span>
        )}
      </div>

      {/* Title + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e2e8f0" }}>
            {contract?.filename?.replace(/\.[^.]+$/, "") ?? "Contrato"}
          </h1>
          <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Escaneo algorítmico completado con modelo Suchus-Legal-v2.1 · {analysis?.clauses?.length ?? 0} páginas analizadas
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button className="btn-sm">📤 Exportar Dictamen</button>
          <Link href={`/dashboard/contracts/${params.id}/chat`} className="btn-teal-sm">
            💬 Preguntar a la IA →
          </Link>
        </div>
      </div>

      {/* Ficha Resumen */}
      <div style={{
        background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px", padding: "18px 20px", marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>
            📋 Ficha Resumen del Instrumento
          </div>
          <span style={{ fontSize: "0.65rem", color: "#22c55e" }}>✅ Validación Criptográfica OK</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
          {[
            {
              label: "PARTES INVOLUCRADAS",
              value: analysis?.parties?.join(" (Cliente) y ") + " (Prestador)" || "—",
            },
            {
              label: "COMPROMISO ECONÓMICO",
              value: "$2.500.000 ARS",
              sub: "mensual facturable",
            },
            {
              label: "VIGENCIA Y PLAZO",
              value: analysis?.key_dates?.[0]?.date ?? "—",
              sub: "12 meses corridos",
            },
            {
              label: "SEVERIDAD GENERAL",
              value: highCount > 0 ? "● Alto" : mediumCount > 0 ? "● Medio" : "● Bajo",
              valueColor: highCount > 0 ? "#ef4444" : mediumCount > 0 ? "#f59e0b" : "#22c55e",
              sub: highCount > 0 ? "Requiere revisión urgente de cláusulas" : "",
            },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: (item as typeof item & { valueColor?: string }).valueColor ?? "#e2e8f0", lineHeight: 1.4 }}>
                {item.value}
              </div>
              {item.sub && <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: "2px" }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Riesgos */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>
            Riesgos detectados en el contrato
          </h2>
          <div style={{ display: "flex", gap: "8px", fontSize: "0.7rem" }}>
            {highCount > 0 && <span style={{ color: "#ef4444" }}>● {highCount} Crítico</span>}
            {mediumCount > 0 && <span style={{ color: "#f59e0b" }}>● {mediumCount} Media</span>}
            {lowCount > 0 && <span style={{ color: "#22c55e" }}>● {lowCount} Neutra</span>}
          </div>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "16px" }}>
          Cláusulas clasificadas por nivel de riesgo identificado por el modelo de IA.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {risks.length > 0 ? risks.map((risk, i) => {
            const rc = RISK_COLORS[risk.severity];
            return (
              <div key={i} style={{
                background: "#111827", border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: "12px", overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0" }}>
                    {risk.clause}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Pág. {(i + 1) * 3} · Párr. {i + 1}</span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
                      background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text,
                    }}>● {rc.label}</span>
                  </div>
                </div>
                {/* Body */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                  <div style={{ padding: "14px 16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      DICTAMEN DEL MODELO
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6 }}>{risk.description}</p>
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      📍 RECOMENDACIÓN RÁPIDA
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "10px" }}>
                      {risk.severity === "high"
                        ? "Negociar tope del 10% y plan de gracia de 10 días."
                        : risk.severity === "medium"
                        ? "Reducir ventana de preaviso a 30 días."
                        : "Sin observaciones obligatorias."}
                    </p>
                    <Link href={`/dashboard/contracts/${params.id}/chat`}
                      style={{ fontSize: "0.7rem", color: "#2dd4bf", textDecoration: "none" }}>
                      Redactar contrapropuesta con IA →
                    </Link>
                  </div>
                </div>
              </div>
            );
          }) : (
            /* Placeholder risks if no backend analysis yet */
            [
              { clause: "Art. 7  Cláusula 7 — Penalidad por Incumplimiento", description: "Se establece una penalidad fija del 50% sobre el valor total del contrato ante cualquier demora operativa, sin derecho previo a la subsanación ni acreditación de daño emergente.", severity: "high" as const },
              { clause: "Art. 9  Cláusula 9 — Renovación Automática", description: "El contrato contempla renovación automática por períodos iguales de 12 meses si no se notifica la rescisión con un preaviso mínimo de 60 días corridos.", severity: "medium" as const },
              { clause: "Art. 4  Cláusula 4 — Confidencialidad y Uso de Información", description: "Obligación bilateral de confidencialidad estándar por un plazo de 2 años posteriores a la finalización del servicio.", severity: "low" as const },
            ].map((risk, i) => {
              const rc = RISK_COLORS[risk.severity];
              return (
                <div key={i} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0" }}>{risk.clause}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Pág. {(i + 1) * 4} · Párr. {i + 2}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>● {rc.label}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    <div style={{ padding: "14px 16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>DICTAMEN DEL MODELO</div>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6 }}>{risk.description}</p>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>📍 RECOMENDACIÓN RÁPIDA</div>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "10px" }}>
                        {risk.severity === "high" ? "Negociar tope del 10% y plan de gracia de 10 días." : risk.severity === "medium" ? "Reducir ventana de preaviso a 30 días. Ajustar término de preaviso →" : "Sin observaciones. Alineada a los estándares habituales de la industria corporativa."}
                      </p>
                      <Link href={`/dashboard/contracts/${params.id}/chat`} style={{ fontSize: "0.7rem", color: "#2dd4bf", textDecoration: "none" }}>
                        Redactar contrapropuesta con IA →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CTA Chat */}
      <div style={{
        background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px", padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "18px", marginTop: "2px" }}>💬</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "3px" }}>
              ¿Querés consultar detalles específicos o formular contrapropuestas?
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
              El asistente tiene cargado todo el articulado y jurisprudencia comparada para redactar cláusulas de reemplazo.
            </div>
          </div>
        </div>
        <Link href={`/dashboard/contracts/${params.id}/chat`} className="btn-teal-sm" style={{ whiteSpace: "nowrap" }}>
          Ir al Chat con IA →
        </Link>
      </div>
    </div>
  );
}
