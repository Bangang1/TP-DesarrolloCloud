"use client";

import Link from "next/link";
import { useState } from "react";

// ── Tipos para la demostración interactiva ────────────────────────────────────
type InterfaceTab = "dashboard" | "upload" | "audit" | "chat";

interface SampleClause {
  id: string;
  clause: string;
  title: string;
  severity: "high" | "medium" | "low";
  text: string;
  mitigation: string;
}

interface ChatMockMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  referencedClause?: string;
}

// ── Datos de muestra para el simulador ────────────────────────────────────────
const SAMPLE_CLAUSES: SampleClause[] = [
  {
    id: "cl-1",
    clause: "Cláusula 8.2",
    title: "Renovación Automática Tácita con Preaviso Desproporcionado",
    severity: "high",
    text: "«El presente contrato se prorrogará automáticamente por periodos sucesivos de doce (12) meses, a menos que el Cliente notifique su voluntad de no renovar con una antelación mínima de noventa (90) días corridos previo al vencimiento del periodo vigente.»",
    mitigation: "Riesgo crítico de prórroga forzosa. Se sugiere reducir el plazo de preaviso a 30 días y exigir notificación fehaciente por email sin renovación tácita forzosa.",
  },
  {
    id: "cl-2",
    clause: "Cláusula 12.1",
    title: "Limitación Unilateral de Responsabilidad del Proveedor",
    severity: "high",
    text: "«En ningún caso la responsabilidad acumulada total del Proveedor frente al Cliente excederá el importe efectivamente abonado por este en el último mes de facturación, excluyendo toda indemnización por lucro cesante o pérdidas indirectas.»",
    mitigation: "Desbalance contractual severo. Se recomienda fijar un tope recíproco equivalente a 12 meses de servicio y excluir dolo o culpa grave de las limitaciones.",
  },
  {
    id: "cl-3",
    clause: "Cláusula 5.4",
    title: "Intereses Moratorios y Penalidad Diaria por Retraso",
    severity: "medium",
    text: "«La falta de pago dentro de los diez (10) días de emitida la factura devengará un interés punitorio del 0.8% diario hasta su efectivo cobro, más un cargo administrativo fijo del 15%.»",
    mitigation: "Tasa usuraria potencial que supera ampliamente las tasas bancarias promedio. Se sugiere limitar a tasa activa de referencia o máximo 2% mensual acumulado.",
  },
  {
    id: "cl-4",
    clause: "Cláusula 16.3",
    title: "Jurisdicción y Prórroga de Competencia Territorial",
    severity: "low",
    text: "«Las partes se someten a los Tribunales Ordinarios en lo Comercial de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción que pudiera corresponder.»",
    mitigation: "Cláusula estándar para contratación local. Verificar coincidencia geográfica con el domicilio legal de la empresa para evitar costos de litigación a distancia.",
  },
];

const INITIAL_CHAT_MESSAGES: ChatMockMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    content: "Hola. He completado el análisis exhaustivo del «Contrato de Servicios Cloud SaaS 2025». He indexado 18 cláusulas y detectado 2 riesgos de severidad alta y 1 media. ¿Qué deseas consultar sobre este acuerdo?",
    timestamp: "10:42",
  },
  {
    id: "m-2",
    role: "user",
    content: "¿Cómo puedo rescindir este contrato si el servicio del proveedor falla o no me convence?",
    timestamp: "10:43",
  },
  {
    id: "m-3",
    role: "assistant",
    content: "Según la Cláusula 8.2 y 9.1:\n\n• Rescisión ordinaria: Solo puedes evitar la renovación notificando con 90 días de anticipación antes del vencimiento anual.\n• Rescisión por incumplimiento (falla de servicio): Deberás intimar fehacientemente al proveedor otorgándole 30 días para subsanar la falla. Si no la corrige, podrás rescindir sin penalidad, pero el reclamo indemnizatorio estará topado al equivalente a 1 mes de factura según la Cláusula 12.1.",
    timestamp: "10:43",
    referencedClause: "Cláusula 8.2 & Cláusula 12.1",
  },
];

export default function LandingPage() {
  // Estado para la barra de navegación móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado para la demostración interactiva de interfaces
  const [activeTab, setActiveTab] = useState<InterfaceTab>("dashboard");
  const [selectedClause, setSelectedClause] = useState<SampleClause>(SAMPLE_CLAUSES[0]);

  // Estado para simulación de upload
  const [simulatingUpload, setSimulatingUpload] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  // Estado para simulación de chat
  const [chatMessages, setChatMessages] = useState<ChatMockMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [isTypingAi, setIsTypingAi] = useState(false);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Función para simular el proceso de ingesta y OCR en la nube
  const runUploadSimulation = () => {
    if (simulatingUpload) return;
    setSimulatingUpload(true);
    setUploadStep(1);

    setTimeout(() => {
      setUploadStep(2);
      setTimeout(() => {
        setUploadStep(3);
        setTimeout(() => {
          setUploadStep(4);
          setSimulatingUpload(false);
        }, 1100);
      }, 1100);
    }, 1000);
  };

  // Función para enviar mensaje en el chat interactivo
  const handleSendChatMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isTypingAi) return;

    const newMsg: ChatMockMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setIsTypingAi(true);

    setTimeout(() => {
      let aiResponse = "He revisado el contrato en base a tu consulta. La cláusula correspondiente establece condiciones estrictas sobre este aspecto.";
      let refClause = "Cláusula del Contrato";

      const lower = query.toLowerCase();
      if (lower.includes("rescind") || lower.includes("cancelar") || lower.includes("baja")) {
        aiResponse = "Para rescindir sin penalidad debes enviar carta documento o notificación fehaciente con al menos 90 días corridos de anticipación a la fecha de renovación anual. De lo contrario, el contrato se prorroga automáticamente por 12 meses más.";
        refClause = "Cláusula 8.2";
      } else if (lower.includes("penalidad") || lower.includes("multa") || lower.includes("interes") || lower.includes("demora") || lower.includes("mora")) {
        aiResponse = "Existe una penalidad por pago fuera de término del 0.8% diario (aprox. 24% mensual) más 15% en concepto de gastos administrativos. Esto representa una condición potencialmente gravosa frente a estándares del mercado.";
        refClause = "Cláusula 5.4";
      } else if (lower.includes("propiedad") || lower.includes("intelectual") || lower.includes("datos") || lower.includes("copyright")) {
        aiResponse = "Tus datos y archivos continúan siendo de tu propiedad exclusiva. Sin embargo, el proveedor se reserva una licencia no exclusiva para procesar y alojar la información durante la vigencia del servicio.";
        refClause = "Cláusula 11.3";
      } else if (lower.includes("responsabilidad") || lower.includes("daño") || lower.includes("falla")) {
        aiResponse = "El proveedor limita su responsabilidad máxima por cualquier daño al valor abonado durante el último mes de facturación, excluyendo explícitamente lucro cesante y daños indirectos.";
        refClause = "Cláusula 12.1";
      } else {
        aiResponse = `En el marco del contrato analizado, la ${refClause} regula este punto. El documento contempla obligaciones recíprocas pero asigna la carga de la prueba al cliente en caso de discrepancias operativas.`;
      }

      const aiReply: ChatMockMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        referencedClause: refClause,
      };

      setChatMessages((prev) => [...prev, aiReply]);
      setIsTypingAi(false);
    }, 850);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d18] text-[#e2e8f0] relative overflow-x-hidden font-sans">
      {/* ── Fondos ambientales decorativos ── */}
      <div className="glow-teal-blob w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] -top-20 -left-20 opacity-30 pointer-events-none" />
      <div className="glow-teal-blob w-[360px] sm:w-[600px] h-[360px] sm:h-[600px] top-[800px] -right-20 opacity-25 bg-teal-500 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* ── 1. HEADER & NAVBAR RESPONSIVA ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d18]/90 border-b border-white/10 transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo y versión */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-all">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Contract<span className="gradient-text">AI</span>
                </span>
                <span className="mvp-badge text-[10px] hidden xs:inline-block">CLOUD</span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono hidden sm:block">Legal Intelligence v2.1</p>
            </div>
          </Link>

          {/* Enlaces de navegación desktop (solo en pantallas grandes para evitar rotura) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-gray-300">
            <a href="#como-funciona" className="hover:text-teal-400 transition-colors whitespace-nowrap">
              Paso a Paso
            </a>
            <a href="#interfaces-demo" className="hover:text-teal-400 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Simulador de Interfaces
            </a>
            <a href="#arquitectura" className="hover:text-teal-400 transition-colors whitespace-nowrap">
              Arquitectura Cloud
            </a>
            <a href="#matriz-riesgo" className="hover:text-teal-400 transition-colors whitespace-nowrap">
              Matriz de Riesgo
            </a>
            <a href="#faq" className="hover:text-teal-400 transition-colors whitespace-nowrap">
              FAQ
            </a>
          </nav>

          {/* Accesos de autenticación / plataforma */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/sign-in" className="btn-ghost text-xs sm:text-sm py-2 px-3 sm:px-4 hidden sm:inline-flex">
              Iniciar Sesión
            </Link>
            <Link href="/dashboard" className="btn-glow text-xs sm:text-sm py-2 px-3.5 sm:px-4.5 whitespace-nowrap">
              <span>Dashboard</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            {/* Botón Hamburger para móviles/tablets */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white focus:outline-none"
              aria-label="Abrir Menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú desplegable para móviles y tablets (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0c1020]/95 backdrop-blur-xl px-5 py-4 space-y-3.5 fade-in">
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-200 hover:text-teal-400 py-1"
            >
              • Flujo Paso a Paso
            </a>
            <a
              href="#interfaces-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-200 hover:text-teal-400 py-1"
            >
              • Simulador de Interfaces
            </a>
            <a
              href="#arquitectura"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-200 hover:text-teal-400 py-1"
            >
              • Arquitectura Cloud
            </a>
            <a
              href="#matriz-riesgo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-200 hover:text-teal-400 py-1"
            >
              • Matriz de Riesgo
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-200 hover:text-teal-400 py-1"
            >
              • Preguntas Frecuentes
            </a>
            <div className="pt-2 border-t border-white/10 flex gap-3">
              <Link href="/sign-in" className="btn-ghost text-xs py-2 px-4 flex-1 text-center justify-center">
                Iniciar Sesión
              </Link>
              <Link href="/dashboard" className="btn-glow text-xs py-2 px-4 flex-1 text-center justify-center">
                Ir al Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. SECCIÓN HERO (Alineada, centrada y 100% responsiva) ─────────────── */}
      <section className="relative z-10 pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 text-center w-full max-w-5xl mx-auto">
        {/* Badge superior de tecnología */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold mb-6 shadow-sm shadow-teal-500/20 max-w-full">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping flex-shrink-0" />
          <span className="truncate">TP Desarrollo Cloud · Auditoría Legal con IA & Microservicios</span>
        </div>

        {/* Título de alto impacto con wrap limpio */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] mb-5 text-white">
          Tus contratos auditados con{" "}
          <span className="gradient-text">precisión jurídica</span> y poder cloud.
        </h1>

        {/* Subtítulo legible y equilibrado */}
        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
          ContractAI ingesta documentos legales en formatos <strong className="text-white">PDF y DOCX</strong>,
          extrae cláusulas mediante OCR, evalúa riesgos contractuales con modelos LLM en la nube y te permite
          <span className="text-teal-300 font-medium"> dialogar en lenguaje natural</span> con cada contrato.
        </p>

        {/* Botones de acción principales */}
        <div className="flex flex-col xs:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full max-w-md mx-auto">
          <Link href="/dashboard" className="btn-glow text-sm sm:text-base py-3 px-6 sm:px-8 w-full xs:w-auto text-center font-bold justify-center">
            ⚡ Probar Sistema en Vivo
          </Link>
          <a href="#interfaces-demo" className="btn-ghost text-sm sm:text-base py-3 px-5 sm:px-6 w-full xs:w-auto text-center font-semibold justify-center">
            🔍 Ver Demostración de Interfaces
          </a>
        </div>

        {/* Métricas clave del sistema (Responsiva: 2 col en móvil, 4 en desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl mx-auto pt-6 border-t border-white/10">
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left flex flex-col justify-between">
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-400 mb-0.5">&lt; 15 seg</div>
              <div className="text-xs font-semibold text-gray-200">Auditoría Rápida</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">OCR + Tokenización + IA</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left flex flex-col justify-between">
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-0.5">3 Niveles</div>
              <div className="text-xs font-semibold text-gray-200">Matriz de Severidad</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Alto, Medio y Bajo riesgo</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left flex flex-col justify-between">
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-400 mb-0.5">100% Cloud</div>
              <div className="text-xs font-semibold text-gray-200">Infraestructura S3</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">FastAPI, Mongo & n8n</div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left flex flex-col justify-between">
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 mb-0.5">RAG Activo</div>
              <div className="text-xs font-semibold text-gray-200">Chat Jurídico en Vivo</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Cita cláusulas textuales</div>
          </div>
        </div>
      </section>

      {/* ── 3. FLUJO PASO A PASO DEL SISTEMA ──────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-3 py-1 rounded-md mb-3 border border-teal-500/20">
            Flujo Operativo
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            El Paso a Paso: Del Documento al Dictamen
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Cómo la plataforma procesa, analiza y blinda tus acuerdos legales de principio a fin.
          </p>
        </div>

        {/* Grilla uniforme de 4 pasos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Paso 1 */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between h-full group hover:border-teal-400/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">📤</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-teal-300 border border-white/10">
                  PASO 01
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                Ingesta & Resguardo S3
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Sube tu archivo (PDF, DOCX). El sistema valida la integridad MIME, genera un identificador seguro y resguarda el documento en un bucket AWS S3 con metadatos persistidos en MongoDB.
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[11px] text-teal-400 font-mono">
              ● Validación & Cifrado S3
            </div>
          </div>

          {/* Paso 2 */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between h-full group hover:border-teal-400/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">⚙️</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-teal-300 border border-white/10">
                  PASO 02
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                Pipeline n8n & OCR
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                FastAPI dispara un webhook asíncrono hacia n8n. El motor extrae el texto, ejecuta OCR en páginas escaneadas y divide el articulado en bloques semánticos normalizados.
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[11px] text-teal-400 font-mono">
              ● Desacoplado vía Webhook
            </div>
          </div>

          {/* Paso 3 */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between h-full group hover:border-teal-400/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">🧠</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-teal-300 border border-white/10">
                  PASO 03
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                Auditoría IA & Matriz
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                El modelo de lenguaje analiza penalizaciones, plazos de rescisión, prórrogas tácitas y cláusulas abusivas, asignando niveles de severidad y generando sugerencias de redacción.
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[11px] text-teal-400 font-mono">
              ● Salida estructurada JSON
            </div>
          </div>

          {/* Paso 4 */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between h-full group hover:border-teal-400/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">💬</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-teal-300 border border-white/10">
                  PASO 04
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                Chat RAG Jurídico
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                El usuario visualiza el dictamen en el dashboard y puede dialogar de forma interactiva con el contrato, obteniendo respuestas inmediatas sustentadas con citas textuales.
              </p>
            </div>
            <div className="pt-3 border-t border-white/5 text-[11px] text-teal-400 font-mono">
              ● Historial en MongoDB
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SIMULADOR INTERACTIVO DE CADA INTERFAZ (100% Responsivo) ────────── */}
      <section id="interfaces-demo" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-3 py-1 rounded-md mb-2 border border-teal-500/20">
            Showcase en Vivo
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2">
            ¿Cómo Funciona Cada Interfaz?
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Toca las pestañas a continuación para interactuar y explorar el funcionamiento de cada pantalla.
          </p>
        </div>

        {/* Barra selectora de interfaces con scroll horizontal suave en móvil */}
        <div className="w-full flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 pb-2 mb-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border flex-shrink-0 whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-teal-500/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>📊</span>
            <span>1. Panel General</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border flex-shrink-0 whitespace-nowrap ${
              activeTab === "upload"
                ? "bg-teal-500/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>📤</span>
            <span>2. Ingesta (Upload)</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border flex-shrink-0 whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-teal-500/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>⚖️</span>
            <span>3. Matriz de Cláusulas</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer border flex-shrink-0 whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-teal-500/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10"
                : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <span>💬</span>
            <span>4. Asistente RAG</span>
          </button>
        </div>

        {/* Contenedor Mockup con marco de ventana */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/15 shadow-2xl w-full">
          {/* Barra superior de ventana */}
          <div className="bg-[#0c1020] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block flex-shrink-0" />
              <span className="text-[11px] font-mono text-gray-400 ml-2 truncate">
                app.contractai.cloud/
                {activeTab === "dashboard"
                  ? "dashboard"
                  : activeTab === "upload"
                  ? "dashboard/upload"
                  : activeTab === "audit"
                  ? "contracts/doc_saas_2025"
                  : "contracts/doc_saas_2025/chat"}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
              <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 hidden xs:inline-block">
                LIVE DEMO
              </span>
              <Link href="/dashboard" className="text-xs text-gray-300 hover:text-white flex items-center gap-1">
                <span>Abrir App</span>
                <span>↗</span>
              </Link>
            </div>
          </div>

          {/* CUERPO DEL SIMULADOR SEGÚN PESTAÑA SELECCIONADA */}
          <div className="p-4 sm:p-6 md:p-8 bg-[#090d18]/95 min-h-[480px]">
            {/* ── TAB 1: DASHBOARD MOCKUP ────────────────────────────────────────── */}
            {activeTab === "dashboard" && (
              <div className="fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <span>Panel de Control & Auditoría</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        Live Data
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Monitorea el inventario contractual, estado de procesamiento de n8n y severidad de riesgos.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="btn-primary text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <span>⊕</span>
                    <span>Subir Contrato</span>
                  </button>
                </div>

                {/* 4 Cards de métricas responsivas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="stat-card p-3 sm:p-4">
                    <div className="stat-label text-[11px] mb-1">
                      Total Contratos <span>📄</span>
                    </div>
                    <div className="stat-value text-xl sm:text-2xl">14</div>
                    <div className="stat-sub text-[10px]">Ingestados en S3</div>
                  </div>
                  <div className="stat-card p-3 sm:p-4">
                    <div className="stat-label text-[11px] mb-1">
                      Analizados <span>✅</span>
                    </div>
                    <div className="stat-value text-xl sm:text-2xl text-teal-400">12</div>
                    <div className="stat-sub text-[10px]">Dictamen generado</div>
                  </div>
                  <div className="stat-card p-3 sm:p-4">
                    <div className="stat-label text-[11px] mb-1">
                      Riesgo Crítico <span>⚠️</span>
                    </div>
                    <div className="stat-value text-xl sm:text-2xl danger">3</div>
                    <div className="stat-sub text-[10px]">Cláusulas lesivas</div>
                  </div>
                  <div className="stat-card p-3 sm:p-4">
                    <div className="stat-label text-[11px] mb-1">
                      Tasa Efectividad <span>⚡</span>
                    </div>
                    <div className="stat-value text-xl sm:text-2xl text-emerald-400">96%</div>
                    <div className="stat-sub text-[10px]">Precisión legal OCR</div>
                  </div>
                </div>

                {/* Tabla con scroll horizontal garantizado */}
                <div className="table-card">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Contratos Recientes
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Actualizado hace 2 min</span>
                  </div>
                  <div className="table-wrap overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr>
                          <th>Documento Legal</th>
                          <th>Fecha Subida</th>
                          <th>Estado Pipeline</th>
                          <th>Nivel de Riesgo</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="doc-name">
                              <span className="text-red-400">📕</span>
                              <span className="font-semibold text-white truncate max-w-[220px]">
                                Contrato-SaaS-CloudServices-2025.pdf
                              </span>
                            </div>
                          </td>
                          <td className="text-xs text-gray-400">Hoy, 10:14</td>
                          <td>
                            <span className="status-badge analyzed">● Analizado</span>
                          </td>
                          <td>
                            <span className="risk-badge high">Alto (2 cláusulas)</span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setActiveTab("audit")}
                                className="btn-teal-sm text-[11px] cursor-pointer"
                              >
                                Ver Dictamen
                              </button>
                              <button
                                onClick={() => setActiveTab("chat")}
                                className="btn-sm text-[11px] cursor-pointer"
                              >
                                💬 Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className="doc-name">
                              <span className="text-blue-400">📘</span>
                              <span className="font-semibold text-white truncate max-w-[220px]">
                                Acuerdo-Confidencialidad-NDA.docx
                              </span>
                            </div>
                          </td>
                          <td className="text-xs text-gray-400">Ayer, 18:30</td>
                          <td>
                            <span className="status-badge analyzed">● Analizado</span>
                          </td>
                          <td>
                            <span className="risk-badge low">Bajo (Estándar)</span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setActiveTab("audit")}
                                className="btn-teal-sm text-[11px] cursor-pointer"
                              >
                                Ver Dictamen
                              </button>
                              <button
                                onClick={() => setActiveTab("chat")}
                                className="btn-sm text-[11px] cursor-pointer"
                              >
                                💬 Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div className="doc-name">
                              <span className="text-yellow-400">📙</span>
                              <span className="font-semibold text-white truncate max-w-[220px]">
                                Locacion-Comercial-SedeCentral.pdf
                              </span>
                            </div>
                          </td>
                          <td className="text-xs text-gray-400">22 Sep 2026</td>
                          <td>
                            <span className="status-badge analyzed">● Analizado</span>
                          </td>
                          <td>
                            <span className="risk-badge medium">Medio (Indexación)</span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setActiveTab("audit")}
                                className="btn-teal-sm text-[11px] cursor-pointer"
                              >
                                Ver Dictamen
                              </button>
                              <button
                                onClick={() => setActiveTab("chat")}
                                className="btn-sm text-[11px] cursor-pointer"
                              >
                                💬 Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: UPLOAD & INGESTA MOCKUP ─────────────────────────────────── */}
            {activeTab === "upload" && (
              <div className="fade-in max-w-xl mx-auto space-y-5">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Módulo de Ingesta & Pipeline</h3>
                  <p className="text-xs text-gray-400">
                    Sube documentos legales para ser procesados mediante microservicios en la nube.
                  </p>
                </div>

                {/* Zona de Drop simulada */}
                <div className="border-2 border-dashed border-teal-500/30 rounded-2xl p-6 sm:p-8 text-center bg-teal-500/[0.02] hover:bg-teal-500/[0.05] transition-all">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl mx-auto mb-2.5">
                    📁
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-white mb-1">
                    Arrastra tu archivo aquí o haz clic para explorar
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Soporta formatos PDF y DOCX con OCR automático (Máx: 25MB)
                  </p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-gray-300">
                    <span>📄 Archivo de prueba: <strong>Contrato_Servicios_Cloud_2025.pdf</strong> (1.8 MB)</span>
                  </div>
                </div>

                {/* Botón de acción para simular la ingesta */}
                <div className="flex justify-center">
                  <button
                    onClick={runUploadSimulation}
                    disabled={simulatingUpload}
                    className="btn-glow py-2.5 px-5 text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {simulatingUpload ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Ejecutando Pipeline Cloud...</span>
                      </>
                    ) : (
                      <>
                        <span>▶ Simular Ingesta & Análisis en la Nube</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pasos en vivo de la simulación */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Estado de ejecución del Pipeline:
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      uploadStep >= 1
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                        : "bg-white/[0.02] border-white/5 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{uploadStep > 1 ? "✅" : uploadStep === 1 ? "🔄" : "⏳"}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">Paso 1: Almacenamiento seguro en AWS S3</div>
                        <div className="text-[10px] text-gray-400 truncate">Resguardo inmutable y persistencia en MongoDB</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono flex-shrink-0 ml-2">{uploadStep >= 1 ? "Completado" : "Pendiente"}</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      uploadStep >= 2
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                        : "bg-white/[0.02] border-white/5 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{uploadStep > 2 ? "✅" : uploadStep === 2 ? "🔄" : "⏳"}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">Paso 2: Webhook a n8n & Extracción OCR</div>
                        <div className="text-[10px] text-gray-400 truncate">Parsing de cláusulas y tablas estructuradas</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono flex-shrink-0 ml-2">{uploadStep >= 2 ? "Completado" : "Pendiente"}</span>
                  </div>

                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      uploadStep >= 3
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                        : "bg-white/[0.02] border-white/5 text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{uploadStep >= 4 ? "✅" : uploadStep === 3 ? "🔄" : "⏳"}</span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">Paso 3: Evaluación de Riesgo con Modelo LLM</div>
                        <div className="text-[10px] text-gray-400 truncate">Matriz de severidad y habilitación de chat RAG</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono flex-shrink-0 ml-2">{uploadStep >= 3 ? "Completado" : "Pendiente"}</span>
                  </div>

                  {uploadStep === 4 && (
                    <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs text-center flex items-center justify-center gap-2 fade-in">
                      <span>🎉 ¡Análisis completado con éxito!</span>
                      <button
                        onClick={() => setActiveTab("audit")}
                        className="underline font-bold text-white hover:text-green-200 cursor-pointer"
                      >
                        Ver Dictamen →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: AUDITORÍA Y MATRIZ DE CLÁUSULAS MOCKUP ───────────────────── */}
            {activeTab === "audit" && (
              <div className="fade-in space-y-5">
                {/* Header del contrato auditado */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
                        ● RIESGO GENERAL: ALTO
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">#CT-8921</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Contrato de Servicios SaaS 2025</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Partes: Suchus Cloud Corp vs. TechEnterprise SRL
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="btn-glow text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬 Iniciar Chat Jurídico</span>
                  </button>
                </div>

                {/* Ficha Resumen Ejecutivo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vigencia & Plazos</div>
                    <div className="text-xs font-semibold text-white">12 meses (Renovación tácita)</div>
                    <div className="text-[11px] text-amber-400 mt-0.5">⚠️ Preaviso: 90 días</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Penalidades Detectadas</div>
                    <div className="text-xs font-semibold text-white">0.8% diario + 15% cargo fijo</div>
                    <div className="text-[11px] text-red-400 mt-0.5">🔴 Desproporcionado</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Fuero & Jurisdicción</div>
                    <div className="text-xs font-semibold text-white">Tribunales CABA</div>
                    <div className="text-[11px] text-emerald-400 mt-0.5">🟢 Competencia local</div>
                  </div>
                </div>

                {/* Selector de Cláusulas y Detalle */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Lista de cláusulas */}
                  <div className="lg:col-span-5 space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Cláusulas con Alertas (Toca para auditar):
                    </div>
                    <div className="max-h-[280px] sm:max-h-[340px] overflow-y-auto no-scrollbar space-y-2">
                      {SAMPLE_CLAUSES.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedClause(c)}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedClause.id === c.id
                              ? "bg-teal-500/15 border-teal-400 shadow-md shadow-teal-500/10"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono font-bold text-white">{c.clause}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.severity === "high"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : c.severity === "medium"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-green-500/20 text-green-400 border border-green-500/30"
                              }`}
                            >
                              {c.severity === "high" ? "ALTO" : c.severity === "medium" ? "MEDIO" : "BAJO"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300 font-medium truncate">{c.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel de detalle de cláusula */}
                  <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
                        <span className="text-xs font-mono font-bold text-teal-300">{selectedClause.clause}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Texto Extraído</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mb-2">{selectedClause.title}</h4>
                      <blockquote className="p-2.5 sm:p-3 rounded-lg bg-black/40 border-l-2 border-teal-400 text-[11px] sm:text-xs text-gray-300 italic mb-3 leading-relaxed font-serif">
                        {selectedClause.text}
                      </blockquote>
                      <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 mb-1">
                          <span>🛡️ Recomendación de Mitigación:</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{selectedClause.mitigation}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">¿Deseas profundizar?</span>
                      <button
                        onClick={() => {
                          setActiveTab("chat");
                          handleSendChatMessage(`Explícame en detalle los riesgos de la ${selectedClause.clause}: ${selectedClause.title}`);
                        }}
                        className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <span>Preguntar en el Chat</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: CHAT JURÍDICO RAG MOCKUP ────────────────────────────────── */}
            {activeTab === "chat" && (
              <div className="fade-in flex flex-col h-[460px] sm:h-[500px]">
                {/* Header del Chat */}
                <div className="pb-2.5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 text-xs">
                      ⚖️
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Asistente Legal RAG</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[200px] sm:max-w-none">
                        Contexto: <strong>Contrato-SaaS-CloudServices-2025.pdf</strong>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 hidden xs:inline-block">
                    Suchus-Legal-v2.1
                  </span>
                </div>

                {/* Preguntas sugeridas para interacción rápida (Scroll horizontal limpio) */}
                <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                  <span className="text-[10px] text-gray-400 flex-shrink-0">Sugerencias:</span>
                  <button
                    onClick={() => handleSendChatMessage("¿Cómo puedo rescindir el contrato sin pagar penalidad?")}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-teal-500/15 border border-white/10 hover:border-teal-500/30 text-gray-300 hover:text-teal-300 flex-shrink-0 whitespace-nowrap transition-all cursor-pointer"
                  >
                    ¿Cómo rescindir sin penalidad?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("¿Cuáles son las penalidades por atraso en el pago?")}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-teal-500/15 border border-white/10 hover:border-teal-500/30 text-gray-300 hover:text-teal-300 flex-shrink-0 whitespace-nowrap transition-all cursor-pointer"
                  >
                    ¿Qué penalidades hay por mora?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage("¿Quién es el dueño de la propiedad intelectual?")}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-teal-500/15 border border-white/10 hover:border-teal-500/30 text-gray-300 hover:text-teal-300 flex-shrink-0 whitespace-nowrap transition-all cursor-pointer"
                  >
                    ¿De quién es la propiedad intelectual?
                  </button>
                </div>

                {/* Mensajes del chat */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0 ${
                          msg.role === "user"
                            ? "bg-teal-500 text-black font-bold"
                            : "bg-white/10 text-teal-300 border border-white/10"
                        }`}
                      >
                        {msg.role === "user" ? "Tú" : "IA"}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-teal-600/30 border border-teal-500/40 text-white rounded-tr-none"
                            : "bg-white/[0.04] border border-white/10 text-gray-200 rounded-tl-none"
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.content}</div>
                        {msg.referencedClause && (
                          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[9px] text-teal-400 font-mono">
                            <span>📌 Cita textual:</span>
                            <span className="underline">{msg.referencedClause}</span>
                          </div>
                        )}
                        <div className="text-[9px] text-gray-400 text-right mt-1">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}

                  {isTypingAi && (
                    <div className="flex gap-2.5 max-w-[80%] mr-auto fade-in">
                      <div className="w-6 h-6 rounded-md bg-white/10 text-teal-300 border border-white/10 flex items-center justify-center text-[10px]">
                        IA
                      </div>
                      <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                        <span>Analizando vectorialmente el contrato...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input de envío de preguntas */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="pt-2 border-t border-white/10 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe tu consulta legal (ej: ¿Cuáles son las garantías?)..."
                    className="flex-1 min-w-0 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTypingAi}
                    className="btn-glow text-xs py-2 px-3.5 flex-shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. ARQUITECTURA CLOUD DEL SISTEMA (Alineada en cuadrícula uniforme) ── */}
      <section id="arquitectura" className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <div className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-3 py-1 rounded-md mb-2 border border-teal-500/20">
            Cloud Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            Microservicios e Infraestructura Cloud
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            El sistema desacopla la capa de presentación de los procesos pesados de OCR e inferencia con LLMs mediante webhooks.
          </p>
        </div>

        {/* Componentes de la arquitectura con alturas uniformes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">⚡</div>
              <h3 className="text-base font-bold text-white mb-1.5">Frontend Next.js 16</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Renderizado híbrido con App Router. Integración de autenticación de usuarios con Clerk y consumo de endpoints protegidos por JWT.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Next.js 16</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">TailwindCSS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Clerk Auth</span>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">🚀</div>
              <h3 className="text-base font-bold text-white mb-1.5">API Backend con FastAPI</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Microservicio asíncrono en Python 3.11 de alto rendimiento con validación estricta de contratos mediante Pydantic y OpenAPI.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Python 3.11</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">FastAPI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Uvicorn</span>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">🪣</div>
              <h3 className="text-base font-bold text-white mb-1.5">AWS S3 Object Storage</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Almacenamiento escalable de documentos binarios (PDFs, DOCX). Cifrado en reposo y URLs pre-firmadas con expiración para descargas seguras.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">AWS S3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Boto3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Cifrado SSE</span>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">🍃</div>
              <h3 className="text-base font-bold text-white mb-1.5">Base NoSQL MongoDB</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Esquemas flexibles para almacenar la estructura polimórfica de cláusulas, metadatos, matrices de riesgo e historiales de chat.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">MongoDB</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Async Motor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">BSON Docs</span>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">🔀</div>
              <h3 className="text-base font-bold text-white mb-1.5">Orquestación n8n</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Automatización de pipelines complejos: recepción de webhooks, división de texto, ejecución de prompts estructurados y callbacks.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">n8n Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Webhooks</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Event-Driven</span>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6 border-white/10 hover:border-teal-400/30 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="text-2xl sm:text-3xl mb-2.5">🐳</div>
              <h3 className="text-base font-bold text-white mb-1.5">Docker Compose</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Despliegue unificado de frontend, backend FastAPI, base de datos MongoDB y orquestador n8n con redes aisladas y volúmenes.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Docker</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">Compose</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300">CI/CD Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. MATRIZ DE RIESGO Y CATEGORÍAS AUDITADAS ─────────────────────────── */}
      <section id="matriz-riesgo" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-3 py-1 rounded-md mb-2 border border-teal-500/20">
            Taxonomía Legal
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2">
            Riesgos Contractuales Detectados
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            El motor de auditoría está calibrado para detectar contingencias que suelen pasar desapercibidas en revisiones manuales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-xl bg-red-500/[0.04] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">🛑</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Renovación Tácita & Lock-in</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Detecta prórrogas automáticas con ventanas de cancelación angostas y penalizaciones por rescisión anticipada.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">💸</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Intereses & Multas Abusivas</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Calcula tasas anualizadas efectivas de moras, cláusulas penales fijas y ajustes unilaterales de precio.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-teal-500/[0.04] border border-teal-500/20 hover:border-teal-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Confidencialidad & IP</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Evalúa titularidad de la propiedad intelectual desarrollada, excepciones excesivas en NDAs y plazos indefinidos.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-2">🏛️</div>
              <h3 className="text-sm font-bold text-white mb-1.5">Fuero Extranjero & Arbitrajes</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Alerta cuando se pactan arbitrajes internacionales costosos o jurisdicciones foráneas que encarecen la defensa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) ───────────────────────────── */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 w-full max-w-3xl mx-auto border-t border-white/10">
        <div className="text-center mb-10">
          <div className="inline-block text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-3 py-1 rounded-md mb-2 border border-teal-500/20">
            Resolución de Dudas
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Preguntas Frecuentes</h2>
          <p className="text-gray-400 text-xs">
            Detalles técnicos y operativos sobre la plataforma de auditoría de contratos.
          </p>
        </div>

        <div className="space-y-2.5">
          {[
            {
              q: "¿Qué formatos de archivos de contrato puedo subir?",
              a: "El sistema admite archivos en formato PDF (tanto digitales como escaneados con texto rasterizado) y documentos Microsoft Word (.docx). El procesador OCR integrado se encarga de transcribir y normalizar el texto de forma automática.",
            },
            {
              q: "¿Cómo se garantiza la seguridad y privacidad de los documentos?",
              a: "Cada contrato se almacena en un bucket de Amazon S3 con cifrado del lado del servidor (SSE-S3). Los identificadores son anónimos, la autenticación está administrada por Clerk y los microservicios solo acceden a los documentos mediante tokens seguros de corta duración.",
            },
            {
              q: "¿El Chat Jurídico inventa respuestas (alucinaciones)?",
              a: "No. El sistema utiliza una arquitectura RAG (Retrieval-Augmented Generation) estricta: el modelo solo puede responder basándose en los fragmentos de texto explícitamente recuperados del contrato cargado, citando el número de cláusula correspondiente.",
            },
            {
              q: "¿Puedo desplegar esta solución en mi propia infraestructura?",
              a: "Sí. Todo el proyecto se encuentra configurado con Docker Compose, conteniendo el backend FastAPI, la base de datos MongoDB, el frontend Next.js y el motor de automatización n8n, lo cual permite levantarlo en cualquier proveedor cloud (AWS, GCP, Azure o servidores locales).",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02] transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-3.5 sm:p-4 text-left text-xs sm:text-sm font-bold text-white flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.04]"
              >
                <span>{item.q}</span>
                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 text-teal-400 font-mono text-sm">
                  {openFaq === idx ? "−" : "+"}
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-3.5 sm:px-4 pb-3.5 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-2.5">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. BANNER FINAL CTA ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto">
        <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-gradient-to-br from-teal-900/40 via-[#111827] to-[#090d18] border border-teal-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="glow-teal-blob w-60 h-60 -top-10 -right-10 opacity-30 pointer-events-none" />
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            Comienza a auditar tus contratos con inteligencia cloud
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
            Accede al panel de control, sube tu primer documento y descubre cláusulas de riesgo antes de estampar tu firma.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="btn-glow text-xs sm:text-sm px-6 py-3 w-full sm:w-auto font-bold justify-center">
              Ir al Entorno de Auditoría →
            </Link>
            <Link href="/sign-up" className="btn-ghost text-xs sm:text-sm px-5 py-3 w-full sm:w-auto font-semibold justify-center">
              Crear Cuenta de Usuario
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER RESPONSIVO ───────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070a13] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-xs text-gray-400">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span className="font-extrabold text-white">ContractAI</span>
            <span className="text-gray-400">| TP Desarrollo Cloud</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-gray-400 text-[11px]">
            <span>FastAPI</span>
            <span className="hidden sm:inline">•</span>
            <span>Next.js 16</span>
            <span className="hidden sm:inline">•</span>
            <span>AWS S3</span>
            <span className="hidden sm:inline">•</span>
            <span>MongoDB</span>
            <span className="hidden sm:inline">•</span>
            <span>n8n Workflows</span>
          </div>

          <div className="text-gray-400 text-[11px]">
            © {new Date().getFullYear()} Suchus Legal Intelligence. Prototipo Académico.
          </div>
        </div>
      </footer>
    </div>
  );
}
