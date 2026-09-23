"use client";

import { useClerk } from "@clerk/nextjs";

export default function SignOutModal({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "none", border: "none", color: "#6b7280",
            cursor: "pointer", fontSize: "18px", lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: "rgba(239,68,68,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "16px",
          }}>↩</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "1rem" }}>¿Cerrar sesión?</span>
              <span style={{
                fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px",
                background: "rgba(20,184,166,0.15)", color: "#2dd4bf",
                border: "1px solid rgba(20,184,166,0.3)", borderRadius: "4px",
              }}>SUCHUS AI</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "20px", lineHeight: 1.6 }}>
          ¿Estás seguro de que deseás salir de Suchus Contract AI? Tus análisis en curso,
          parámetros heurísticos y documentos indexados quedarán sincronizados y guardados en tu cuenta.
        </p>

        {/* Session details */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px", padding: "14px 16px", marginBottom: "20px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.65rem", fontWeight: 700, color: "#6b7280",
            textTransform: "uppercase", letterSpacing: "0.07em",
            marginBottom: "10px",
          }}>
            <span>● DETALLES DE LA SESIÓN A SUSPENDER</span>
            <span style={{ color: "#2dd4bf" }}>Workspace 01</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "3px" }}>Usuario autenticado</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>👤 Lucas M.</div>
              <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>Alumno / Dev</div>
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "3px" }}>Entorno y Privilegios</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>⚖ Auditoría LegalTech</div>
              <div style={{ fontSize: "0.68rem", color: "#6b7280" }}>Fase Piloto Académico MVP</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "4px" }}>Último contrato analizado</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#e2e8f0" }}>
                <span>📄</span> Contrato de Servicios — Empresa XYZ
              </div>
              <span style={{
                fontSize: "0.65rem", padding: "2px 8px", borderRadius: "4px",
                background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)",
              }}>Guardado auto</span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "20px", lineHeight: 1.5 }}>
          🔒 No perderás ningún cambio. Toda la memoria conversacional con el Chat IA y las auditorías de
          riesgo permanecerán encriptadas hasta tu próximo inicio de sesión.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px",
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", color: "#e2e8f0", fontSize: "0.82rem",
              fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            ✕ Permanecer conectado
          </button>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            style={{
              flex: 1, padding: "10px",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", color: "#ef4444", fontSize: "0.82rem",
              fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
          >
            ↩ Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
