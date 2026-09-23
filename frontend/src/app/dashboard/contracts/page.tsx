"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getContracts, deleteContract } from "@/lib/api";

type Contract = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "error";
  uploaded_at: string;
  risk?: "high" | "medium" | "low";
  type?: string;
};

const RISK_INFO = {
  high:   { label: "Alto",  cls: "risk-badge high",   dot: "#ef4444" },
  medium: { label: "Medio", cls: "risk-badge medium",  dot: "#f59e0b" },
  low:    { label: "Bajo",  cls: "risk-badge low",     dot: "#22c55e" },
};

const STATUS_INFO = {
  completed:  { label: "Analizado",    cls: "status-badge analyzed", icon: "✅" },
  pending:    { label: "Pendiente",    cls: "status-badge pending",  icon: "⏳" },
  processing: { label: "Procesando…", cls: "status-badge pending",  icon: "🔄" },
  error:      { label: "Error",        cls: "status-badge error",    icon: "❌" },
};

const DOC_ICONS: Record<string, string> = {
  nda: "🔒", laboral: "👤", sla: "🖥️", locacion: "🏢", default: "📄",
};

type Filter = "all" | "completed" | "pending";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10_000); return () => clearInterval(iv); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contrato?")) return;
    await deleteContract(id);
    setContracts((p) => p.filter((c) => c.id !== id));
  };

  const filtered = contracts.filter((c) => {
    const matchSearch = c.filename.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "completed" ? c.status === "completed" :
      c.status !== "completed";
    return matchSearch && matchFilter;
  });

  const analyzed = contracts.filter((c) => c.status === "completed").length;
  const pending  = contracts.filter((c) => c.status !== "completed").length;

  const pageStyle = { fontFamily: "var(--font)" };

  return (
    <div className="fade-in" style={pageStyle}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span><span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      {/* REPOSITORIO ACTIVO banner */}
      <div style={{
        border: "1px dashed rgba(20,184,166,0.35)", borderRadius: "12px",
        padding: "20px 24px", marginBottom: "20px",
        background: "rgba(20,184,166,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#14b8a6", display: "inline-block" }} />
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                REPOSITORIO ACTIVO
              </span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "4px" }}>Contratos</h1>
            <p style={{ fontSize: "0.78rem", color: "#64748b" }}>Listado de acuerdos cargados en la plataforma.</p>
          </div>

          {/* Stats + button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Procesados</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>{contracts.length}</span>
                <span style={{ fontSize: "0.65rem", color: "#22c55e", fontWeight: 600 }}>
                  {contracts.length ? Math.round((analyzed / contracts.length) * 100) : 0}% OK
                </span>
              </div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px", padding: "10px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Riesgos Críticos</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ef4444" }}>
                  {contracts.filter((c) => c.risk === "high").length}
                </span>
                <span style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 600 }}>alerta</span>
              </div>
            </div>
            <Link href="/dashboard/upload" className="btn-primary">
              + Subir contrato
            </Link>
          </div>
        </div>

        {/* Índice de Salud Legal */}
        <div style={{
          marginTop: "16px", display: "flex", alignItems: "center", gap: "12px",
          background: "rgba(255,255,255,0.02)", borderRadius: "8px",
          padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: "14px" }}>📈</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>Índice de Salud Legal Global</div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
              83% de cláusulas dentro del estándar normativo regional (v2026.1)
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="80" height="28" viewBox="0 0 80 28">
              <polyline points="0,20 15,15 30,18 45,8 60,12 80,6"
                fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e" }}>+4.2%</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#64748b", borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "12px" }}>
            ✅ IA de Certificación Operativa
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "13px" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contrato por nombre o tipo…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px",
              background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px", color: "#e2e8f0", fontSize: "0.8rem",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "all", label: "Todos", count: contracts.length },
            { key: "completed", label: "Analizados", count: analyzed },
            { key: "pending", label: "Pendientes", count: pending },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as Filter)}
              style={{
                padding: "6px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", border: "1px solid",
                background: filter === key ? "rgba(20,184,166,0.15)" : "transparent",
                borderColor: filter === key ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)",
                color: filter === key ? "#2dd4bf" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {label} <span style={{ marginLeft: "4px", opacity: 0.7 }}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
            <div style={{ width: "20px", height: "20px", border: "2px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.7s linear infinite" }} />
            Cargando repositorio…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📭</div>
            {search ? "Sin resultados para tu búsqueda." : "No hay contratos aún."}{" "}
            {!search && <Link href="/dashboard/upload" style={{ color: "#2dd4bf", textDecoration: "none" }}>Subir primero →</Link>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Nivel de Riesgo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const risk = RISK_INFO[c.risk ?? "low"] ?? RISK_INFO.low;
                  const status = STATUS_INFO[c.status] ?? STATUS_INFO.pending;
                  const docType = c.type?.toLowerCase() ?? "default";
                  const docIcon = DOC_ICONS[docType] ?? DOC_ICONS.default;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="doc-name">
                          <span style={{ fontSize: "16px" }}>{docIcon}</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{c.filename}</div>
                            <div style={{ fontSize: "0.67rem", color: "#64748b" }}>
                              ID: CT-{c.id.slice(-4).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{c.type ?? "Servicios"}</td>
                      <td style={{ color: "#64748b", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {new Date(c.uploaded_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td>
                        {c.risk ? (
                          <span className={risk.cls}>● {risk.label}</span>
                        ) : (
                          <span style={{ color: "#374151", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={status.cls}>{status.icon} {status.label}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {c.status === "completed" ? (
                            <Link href={`/dashboard/contracts/${c.id}`} className="btn-sm">Ver análisis ›</Link>
                          ) : c.status === "pending" ? (
                            <Link href={`/dashboard/contracts/${c.id}`} className="btn-teal-sm">⚡ Analizar ahora</Link>
                          ) : (
                            <span className="btn-sm" style={{ opacity: 0.5, cursor: "default" }}>
                              {c.status === "processing" ? "Procesando…" : "Error"}
                            </span>
                          )}
                          <button onClick={() => handleDelete(c.id)} className="btn-sm" style={{ color: "#ef4444", borderColor: "transparent" }} title="Eliminar">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && contracts.length > 0 && (
          <div className="table-footer">
            <span className="table-footer-text">Mostrando {filtered.length} de {contracts.length} contratos</span>
            <div className="pagination">
              <button className="page-btn">‹</button>
              <button className="page-btn">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
