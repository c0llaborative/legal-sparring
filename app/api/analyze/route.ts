import { NextRequest, NextResponse } from "next/server";
import { analizarExpediente } from "@/lib/anthropic";
import { runGraph } from "@/lib/graph/graph";
import type { Lado } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { texto, lado, modo } = await req.json();
    if (!texto || typeof texto !== "string" || texto.length < 50) {
      return NextResponse.json({ error: "Pega el texto del expediente (mínimo unas líneas)." }, { status: 400 });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Falta OPENROUTER_API_KEY en .env.local. Usa los casos de muestra para el demo sin API." }, { status: 400 });
    }
    const ladoP = (lado as Lado) || "demandante";
    // modo "grafo" = pipeline LangGraph con nodo verificador (más robusto); default = una sola llamada (más rápido).
    const analysis = modo === "grafo" ? await runGraph(texto, ladoP) : await analizarExpediente(texto, ladoP);
    return NextResponse.json(analysis);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error en el análisis" }, { status: 500 });
  }
}
