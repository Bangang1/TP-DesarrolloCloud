import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ContractAI — Análisis Inteligente de Contratos",
  description:
    "Sube tus contratos y obtén análisis detallados con IA. Identifica riesgos, fechas clave y cláusulas importantes en segundos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" className={inter.variable}>
        <body className="bg-gray-950 text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
