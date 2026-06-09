import { NextRequest, NextResponse } from "next/server";
import { sparTurno, type SparMsg } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { historia, contexto } = await req.json();
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ replica: "[Modo demo · agrega OPENROUTER_API_KEY] Señoría, me opongo: el abogado parte de un hecho que no está probado en el expediente. ¿Con qué medio lo acredita?" });
    }
    const replica = await sparTurno((historia || []) as SparMsg[], contexto || "");
    return NextResponse.json({ replica });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
