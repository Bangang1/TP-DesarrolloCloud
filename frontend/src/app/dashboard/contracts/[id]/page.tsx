"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getContract } from "@/lib/api";

type Level = "critica" | "importante" | "leve";

type Clause = {
  title: string;
  level: Level;
  quote?: string;
  explanation?: string;
  recommendation?: string;
};

type Analysis = {
  summary: string;
  parties: string[];
  key_dates: { type: string; date: string; description?: string }[];
  clauses: Clause[];
};

type ContractDetail = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "error";
  error_message?: string | null;
  analysis?: Analysis | null;
};

const LEVELS: Record<Level, { label: string; plural: string; bg: string; border: string; text: string }> = {
  critica:    { label: "Crítica",    plural: "críticas",    bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  text: "#ef4444" },
  importante: { label: "Importante", plural: "importantes", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#f59e0b" },
  leve:       { label: "Leve",       plural: "leves",       bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#22c55e" },
};
const LEVEL_ORDER: Level[] = ["critica", "importante", "leve"];
const POLL_MS = 4000;

const cardStyle = { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" };
const labelStyle = { fontSize: "0.6rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" };

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function load() {
      try {
        const data: ContractDetail = await getContract(id);
        if (cancelled) return;
        setContract(data);
        // Mientras n8n analiza, se vuelve a consultar hasta que termine.
        if (data.status === "pending" || data.status === "processing") timer = setTimeout(load, POLL_MS);
      } catch {
        // Sin contrato se muestra el aviso de "no encontrado"
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#64748b" }}>
      <div style={{ width: "22px", height: "22px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: "12px" }} />
      Cargando análisis…
    </div>
  );

  if (!contract) return (
    <div style={{ ...cardStyle, padding: "24px", color: "#94a3b8", fontSize: "0.85rem" }}>
      No encontramos este contrato. <Link href="/dashboard/contracts" style={{ color: "#2dd4bf" }}>Volver al listado</Link>
    </div>
  );

  const analysis = contract.analysis;
  const clauses  = analysis?.clauses ?? [];
  const counts   = Object.fromEntries(LEVEL_ORDER.map((l) => [l, clauses.filter((c) => c.level === l).length])) as Record<Level, number>;
  const overall: Level = counts.critica > 0 ? "critica" : counts.importante > 0 ? "importante" : "leve";
  const analyzing = contract.status === "pending" || contract.status === "processing";

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

      {/* Title + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e2e8f0" }}>
            {contract.filename.replace(/\.[^.]+$/, "")}
          </h1>
          {analysis && (
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
              Análisis completado · {clauses.length} cláusulas clasificadas
            </p>
          )}
        </div>
        {analysis && (
          <Link href={`/dashboard/contracts/${id}/chat`} className="btn-teal-sm" style={{ flexShrink: 0 }}>
            💬 Preguntar a la IA →
          </Link>
        )}
      </div>

      {/* Estado: analizando / error */}
      {analyzing && (
        <div role="status" style={{ ...cardStyle, padding: "20px", display: "flex", alignItems: "center", gap: "12px", color: "#94a3b8", fontSize: "0.85rem" }}>
          <div style={{ width: "18px", height: "18px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
          Estamos analizando el contrato. Esta página se actualiza sola cuando termine.
        </div>
      )}
      {contract.status === "error" && (
        <div role="alert" style={{ ...cardStyle, borderColor: LEVELS.critica.border, background: LEVELS.critica.bg, padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: LEVELS.critica.text, marginBottom: "6px" }}>No se pudo analizar el contrato</div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6, wordBreak: "break-word" }}>
            {contract.error_message || "Ocurrió un error durante el procesamiento."}
          </p>
        </div>
      )}

      {analysis && (
        <>
          {/* Ficha Resumen */}
          <div style={{ ...cardStyle, padding: "18px 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "10px" }}>
              📋 Ficha Resumen del Instrumento
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "16px" }}>{analysis.summary}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
              <div>
                <div style={labelStyle}>Partes involucradas</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>
                  {analysis.parties.join(" · ") || "—"}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Fechas clave</div>
                {analysis.key_dates.length > 0 ? analysis.key_dates.map((d, i) => (
                  <div key={i} style={{ fontSize: "0.75rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{d.date}</span>
                    {d.description && <span style={{ color: "#64748b" }}> — {d.description}</span>}
                  </div>
                )) : <div style={{ fontSize: "0.78rem", color: "#e2e8f0" }}>—</div>}
              </div>
              <div>
                <div style={labelStyle}>Severidad general</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: LEVELS[overall].text }}>● {LEVELS[overall].label}</div>
                {overall === "critica" && (
                  <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: "2px" }}>Revisar las cláusulas críticas antes de firmar</div>
                )}
              </div>
            </div>
          </div>

          {/* Semáforo de cláusulas */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>Semáforo de cláusulas</h2>
              <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem" }}>
                {LEVEL_ORDER.map((l) => (
                  <span key={l} style={{ color: LEVELS[l].text }}>● {counts[l]} {LEVELS[l].plural}</span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "16px" }}>
              Rojo: no firmar sin negociar. Amarillo: conviene revisar. Verde: sin observaciones.
            </p>

            {clauses.length === 0 ? (
              <div style={{ ...cardStyle, padding: "20px", color: "#94a3b8", fontSize: "0.8rem" }}>
                El análisis no identificó cláusulas en este documento.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {clauses.map((clause, i) => {
                  const lv = LEVELS[clause.level] ?? LEVELS.importante;
                  return (
                    <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${lv.text}`, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e2e8f0" }}>{clause.title}</div>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: lv.bg, border: `1px solid ${lv.border}`, color: lv.text, whiteSpace: "nowrap" }}>
                          ● {lv.label}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        <div style={{ padding: "14px 16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={labelStyle}>Por qué</div>
                          <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6 }}>{clause.explanation || "—"}</p>
                          {clause.quote && (
                            <blockquote style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.5, marginTop: "10px", paddingLeft: "10px", borderLeft: "2px solid rgba(255,255,255,0.1)", fontStyle: "italic" }}>
                              “{clause.quote}”
                            </blockquote>
                          )}
                        </div>
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ ...labelStyle, color: lv.text }}>Recomendación</div>
                          <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.6 }}>{clause.recommendation || "Sin observaciones."}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA Chat */}
          <div style={{ ...cardStyle, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
              ¿Querés consultar detalles o redactar una contrapropuesta?
            </div>
            <Link href={`/dashboard/contracts/${id}/chat`} className="btn-teal-sm" style={{ whiteSpace: "nowrap" }}>
              Ir al Chat con IA →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
