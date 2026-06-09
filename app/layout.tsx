import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Sparring — JSTH",
  description: "Sparring de litigio asistido por IA · reconstruye la teoría del adversario y prepara la audiencia (CGP).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
