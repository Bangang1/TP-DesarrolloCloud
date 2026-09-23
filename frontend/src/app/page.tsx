import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <span className="font-bold text-lg gradient-text">ContractAI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in" className="btn-ghost">Iniciar sesión</Link>
          <Link href="/sign-up" className="btn-primary">Comenzar gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-glow" />
          Análisis con IA · Procesamiento en segundos
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          Tus contratos,{" "}
          <span className="gradient-text">analizados por IA</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Sube cualquier contrato y nuestra IA identifica riesgos, fechas clave, cláusulas
          importantes y partes involucradas — en segundos. Luego pregúntale lo que quieras.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/sign-up" className="btn-primary text-base px-8 py-3">
            Empezar ahora →
          </Link>
          <Link href="/sign-in" className="btn-ghost text-base px-8 py-3">
            Ya tengo cuenta
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full">
          {[
            {
              icon: "🔍",
              title: "Análisis Profundo",
              desc: "Detecta riesgos, obligaciones y cláusulas críticas automáticamente.",
            },
            {
              icon: "💬",
              title: "Chat con tu Contrato",
              desc: "Pregunta en lenguaje natural y obtén respuestas precisas del documento.",
            },
            {
              icon: "🔒",
              title: "100% Privado",
              desc: "Tus documentos están cifrados. Nadie más puede acceder a ellos.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 text-left animate-fade-in">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm border-t border-purple-900/20">
        © 2024 ContractAI — Todos los derechos reservados
      </footer>
    </main>
  );
}
