"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateUploadUrl } from "@/actions/azure";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_EXTENSION = "application/pdf";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadContract() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setErrorMsg("");
    setStatus("idle");
    setContractId("");

    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== ALLOWED_EXTENSION) {
      setErrorMsg("Solo se permiten archivos PDF.");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setErrorMsg("El archivo no puede superar los 3 MB.");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMsg("");
    setProgress("Autenticando usuario...");

    try {
      // 1. Obtener el usuario autenticado de Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Debes iniciar sesión para subir un contrato.");
      }

      // 2. Obtener URL firmada (SAS Token) desde el backend (Server Action)
      setProgress("Generando token de seguridad...");
      const uuid = crypto.randomUUID();
      const filePath = `contratos/${user.id}/${uuid}.pdf`;
      const { uploadUrl, publicUrl } = await generateUploadUrl(filePath);

      // 3. Subir el archivo directamente a Azure Blob Storage mediante la URL firmada
      setProgress("Subiendo PDF a Azure Blob Storage...");
      const azureResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!azureResponse.ok) {
        throw new Error("Error al subir el archivo a Azure Storage.");
      }

      // 4. Notificar al backend en FastAPI con la URL pública
      setProgress("Notificando al backend...");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const apiRes = await fetch(`${API_URL}/api/contratos/analizar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          usuario_id: user.id,
          contrato_url: publicUrl,
        }),
      });

      if (!apiRes.ok) {
        const detail = await apiRes.text();
        throw new Error(detail || "Error al registrar el contrato.");
      }

      const data = await apiRes.json();
      setContractId(data.id);
      setStatus("success");
      setProgress("");

      // Limpiar input
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setProgress("");
      setErrorMsg(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  }

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-white">
        Subir Contrato
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label
          htmlFor="contract-file"
          className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/5 px-6 py-10 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-indigo-400 transition-transform group-hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
          </svg>

          <span className="text-sm text-white/70">
            {file ? file.name : "Arrastrá o seleccioná un archivo PDF (máx. 3 MB)"}
          </span>

          <input
            ref={inputRef}
            id="contract-file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {errorMsg && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        {progress && (
          <p className="flex items-center gap-2 text-sm text-indigo-300">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            {progress}
          </p>
        )}

        {status === "success" && contractId && (
          <p className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            ✓ Contrato registrado correctamente.<br />
            <span className="text-xs text-emerald-300/70">
              El análisis con IA ya comenzó en la nube de Azure.
            </span>
          </p>
        )}

        <button
          type="submit"
          disabled={!file || status === "uploading"}
          className="mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "uploading" ? "Subiendo..." : "Subir y analizar"}
        </button>
      </form>
    </section>
  );
}
