import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Estado de configuración → la UI muestra "IA activa" vs "modo demo".
export async function GET() {
  return NextResponse.json({
    openrouter: !!process.env.OPENROUTER_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    modelo: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5",
  });
}
