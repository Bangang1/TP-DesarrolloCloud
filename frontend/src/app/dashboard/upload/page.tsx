"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadContract } from "@/lib/api";

type Step = { label: string; sub: string; status: "done" | "inProgress" | "pending" };

const INITIAL_STEPS: Step[] = [
  { label: "Paso 1: Leyendo documento",      sub: "Extracción OCR y tokenización estructural finalizada", status: "pending" },
  { label: "Paso 2: Analizando cláusulas con IA", sub: "Evaluando penalidades, plazos de rescisión y jurisprudencia", status: "pending" },
  { label: "Paso 3: Generando resumen y detección de riesgos", sub: "Matriz ejecutiva y recomendaciones de mitigación", status: "pending" },
];

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [steps, setSteps]         = useState<Step[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError]         = useState("");

  const setFile_ = (f: File) => {
    if (f.size > 25 * 1024 * 1024) { setError("El archivo no puede superar 25MB"); return; }
    setFile(f);
    setError("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile_(f);
  }, []);

  const simulateProgress = (contractId: string) => {
    let step = 0;
    const updateStep = (i: number, status: Step["status"]) => {
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status } : s));
    };
    const iv = setInterval(() => {
      if (step > 0) updateStep(step - 1, "done");
      if (step < 3) {
        updateStep(step, "inProgress");
        setCurrentStep(step);
        step++;
      } else {
        clearInterval(iv);
        setTimeout(() => router.push(`/dashboard/contracts/${contractId}`), 800);
      }
    }, 2000);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setSteps(INITIAL_STEPS);
    try {
      const res = await uploadContract(file);
      simulateProgress(res.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al subir el contrato");
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stepsDone  = steps.filter((s) => s.status === "done").length;
  const progressPct = uploading ? (stepsDone / 3) * 100 : 0;

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div className="breadcrumb">
          <span>Plataforma</span><span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Entorno de Auditoría</span>
        </div>
        <span className="proto-tag">Prototipo Académico</span>
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: "20px",
          background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)",
          color: "#2dd4bf", fontSize: "0.7rem", fontWeight: 600, marginBottom: "16px",
        }}>
          ✦ Módulo de Ingesta Inteligente
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#e2e8f0", marginBottom: "8px" }}>
          Subir contrato
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#64748b", maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>
          Subí un archivo en formato PDF o Word para comenzar el análisis automático con IA.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#14b8a6" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "12px", padding: "48px 24px",
          textAlign: "center", cursor: file ? "default" : "pointer",
          background: dragging ? "rgba(20,184,166,0.05)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s", marginBottom: "16px",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile_(f); }}
        />
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>☁️</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "8px" }}>
          Arrastrá tu archivo aquí
        </div>
        <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "14px" }}>o</div>
        <button
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="btn-sm"
          style={{ margin: "0 auto" }}
        >
          Seleccionar archivo
        </button>
        <div style={{ fontSize: "0.68rem", color: "#374151", marginTop: "12px" }}>
          Formatos soportados: PDF, DOCX (hasta 25MB)
        </div>
      </div>

      {/* File Preview */}
      {file && (
        <div style={{
          display: "flex", alignItems: "center", gap: "14px",
          background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px", padding: "14px 18px", marginBottom: "16px",
        }}>
          <span style={{ fontSize: "24px", color: "#ef4444" }}>📕</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
              {file.name}
              <span style={{
                marginLeft: "8px", fontSize: "0.65rem", color: "#64748b",
                background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "4px",
              }}>
                PDF • {formatSize(file.size)}
              </span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "#22c55e", marginTop: "2px" }}>
              ● Documento PDF verificado y listo para procesar
            </div>
          </div>
          <button
            onClick={() => { setFile(null); setSteps(INITIAL_STEPS); setUploading(false); }}
            className="btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            ↺ Cambiar archivo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: "0.8rem",
        }}>
          ❌ {error}
        </div>
      )}

      {/* Upload Button */}
      {file && !uploading && (
        <button
          onClick={handleUpload}
          style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "10px",
            color: "white", fontSize: "0.95rem", fontWeight: 700,
            cursor: "pointer", marginBottom: "24px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Analizar contrato con IA →
        </button>
      )}

      {/* Progress Steps */}
      {uploading && (
        <div style={{
          background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "20px 24px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px" }}>🔍</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>Analizando contrato…</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
              Paso {Math.min(stepsDone + 1, 3)} de 3 en curso
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            height: "4px", background: "rgba(255,255,255,0.06)",
            borderRadius: "2px", marginBottom: "20px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: "2px",
              background: "linear-gradient(90deg, #14b8a6, #6366f1)",
              width: `${progressPct}%`,
              transition: "width 0.8s ease",
            }} />
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px",
                  background:
                    s.status === "done" ? "rgba(34,197,94,0.15)" :
                    s.status === "inProgress" ? "rgba(99,102,241,0.15)" :
                    "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    s.status === "done" ? "rgba(34,197,94,0.3)" :
                    s.status === "inProgress" ? "rgba(99,102,241,0.4)" :
                    "rgba(255,255,255,0.08)"
                  }`,
                  color:
                    s.status === "done" ? "#22c55e" :
                    s.status === "inProgress" ? "#818cf8" :
                    "#374151",
                }}>
                  {s.status === "done" ? "✓" : s.status === "inProgress" ? "◌" : "○"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 600,
                    color: s.status === "pending" ? "#374151" : "#e2e8f0",
                  }}>{s.label}</div>
                  <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: "1px" }}>{s.sub}</div>
                </div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 600,
                  color:
                    s.status === "done" ? "#22c55e" :
                    s.status === "inProgress" ? "#818cf8" :
                    "#374151",
                }}>
                  {s.status === "done" ? "Completado" :
                   s.status === "inProgress" ? "● En proceso" :
                   "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "0.65rem", color: "#374151", marginTop: "8px" }}>
        ✦ Suchus AI · Entorno demostrativo de investigación legal-tech para validación académica
      </div>
    </div>
  );
}
