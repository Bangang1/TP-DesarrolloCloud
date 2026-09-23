import { redirect } from "next/navigation";

// Redirige al listado de contratos que contiene los análisis
export default function AnalysisPage() {
  redirect("/dashboard/contracts");
}
