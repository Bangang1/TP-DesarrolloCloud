"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getContracts, deleteContract } from "@/lib/api";

type Contract = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "error";
  uploaded_at: string;
  processed_at?: string;
};

const RISK_LEVELS: Record<string, { label: string; cls: string }> = {
  high:   { label: "Alto",    cls: "risk-badge high" },
  medium: { label: "Medio",   cls: "risk-badge medium" },
  low:    { label: "Bajo",    cls: "risk-badge low" },
  none:   { label: "—",       cls: "risk-badge none" },
};

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  completed:  { label: "Analizado",           cls: "status-badge analyzed", icon: "✅" },
  pending:    { label: "Pendiente de análisis", cls: "status-badge pending",  icon: "⏳" },
  processing: { label: "Procesando...",        cls: "status-badge pending",  icon: "🔄" },
  error:      { label: "Error",               cls: "status-badge error",    icon: "❌" },
};

export default function DashboardPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch {
      // sin contratos aún o no autenticado
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10_000);
    return () => clearInterval(iv);
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contrato?")) return;
    await deleteContract(id);
    setContracts((p) => p.filter((c) => c.id !== id));
  };

  const total      = contracts.length;
  const analyzed   = contracts.filter((c) => c.status === "completed").length;
  const highRisk   = contracts.filter((c) => (c as Contract & { risk?: string }).risk === "high").length;
  const pctEfect   = total ? Math.round((analyzed / total) * 100) : 0;

  // Mostrar solo últimos 4
  const recent = [...contracts].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  ).slice(0, 4);

  return (
    <div className="fade-in">
      {/* Breadcrumb + proto tag */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel General</h1>
          <p className="page-subtitle">Resumen del estado y análisis de contratos del sistema.</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          ⊕ Subir nuevo contrato
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {/* Total */}
        <div className="stat-card">
          <div className="stat-label">
            Total Contratos
            <span style={{ fontSize: "16px" }}>📄</span>
          </div>
          <div className="stat-value">{loading ? "—" : total}</div>
          <div className="stat-sub">Registrados</div>
        </div>

        {/* Analizados */}
        <div className="stat-card">
          <div className="stat-label">
            Contratos Analizados
            <span style={{ fontSize: "16px" }}>✅</span>
          </div>
          <div className="stat-value">{loading ? "—" : analyzed}</div>
          <div className="stat-sub">
            <span className="stat-tag green">{pctEfect}% efectividad</span>
          </div>
        </div>

        {/* Riesgo Alto */}
        <div className="stat-card">
          <div className="stat-label">
            Riesgo Alto
            <span style={{ fontSize: "16px" }}>⚠️</span>
          </div>
          <div className="stat-value danger">{loading ? "—" : highRisk}</div>
          <div className="stat-sub">
            {highRisk > 0 && (
              <span className="stat-tag red">● {highRisk} alerta{highRisk > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Próximos Vencimientos — placeholder */}
        <div className="stat-card">
          <div className="stat-label">
            Próximos Vencimientos
            <span style={{ fontSize: "16px" }}>📅</span>
          </div>
          <div className="stat-value">—</div>
          <div className="stat-sub">Próximos 30 días</div>
        </div>
      </div>

      {/* Últimos contratos */}
      <div className="section-header">
        <div className="section-title">
          Mis últimos contratos
          {!loading && recent.length > 0 && (
            <span className="section-badge">{recent.length} recientes</span>
          )}
        </div>
        <Link href="/dashboard/contracts" className="section-link">
          Ver todos →
        </Link>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
            <div style={{ width: "20px", height: "20px", border: "2px solid var(--teal-500)", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.7s linear infinite" }} />
            Cargando contratos...
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📂</div>
            No hay contratos aún.{" "}
            <Link href="/dashboard/upload" style={{ color: "var(--teal-400)", textDecoration: "none" }}>
              Sube el primero →
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre del Documento</th>
                  <th>Fecha Carga</th>
                  <th>Nivel de Riesgo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => {
                  const risk = (c as Contract & { risk?: string }).risk ?? "none";
                  const riskInfo = RISK_LEVELS[risk] ?? RISK_LEVELS.none;
                  const statusInfo = STATUS_MAP[c.status] ?? STATUS_MAP.pending;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="doc-name">
                          <span className="doc-icon">📄</span>
                          {c.filename}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {new Date(c.uploaded_at).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={riskInfo.cls}>
                          ● {riskInfo.label}
                        </span>
                      </td>
                      <td>
                        <span className={statusInfo.cls}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {c.status === "completed" ? (
                            <Link href={`/dashboard/contracts/${c.id}`} className="btn-sm">
                              Ver análisis ›
                            </Link>
                          ) : c.status === "pending" ? (
                            <Link href={`/dashboard/contracts/${c.id}`} className="btn-teal-sm">
                              Procesar ›
                            </Link>
                          ) : (
                            <span className="btn-sm" style={{ opacity: 0.5, cursor: "default" }}>
                              {c.status === "processing" ? "Procesando..." : "Error"}
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="btn-sm"
                            style={{ color: "var(--red)", borderColor: "transparent" }}
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && contracts.length > 0 && (
          <div className="table-footer">
            <span className="table-footer-text">
              Mostrando {recent.length} de {contracts.length} documentos
            </span>
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
