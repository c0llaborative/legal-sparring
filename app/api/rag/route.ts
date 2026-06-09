import { NextRequest, NextResponse } from "next/server";
import { ragRetrieve } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

// Demo del RAG híbrido legal-aware: { texto, query, k? } → top-k chunks con su folio.
export async function POST(req: NextRequest) {
  try {
    const { texto, query, k } = await req.json();
    if (!texto || !query) return NextResponse.json({ error: "Se requieren 'texto' (expediente) y 'query'." }, { status: 400 });
    return NextResponse.json(await ragRetrieve(String(texto), String(query), Number(k) || 5));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "rag-error" }, { status: 500 });
  }
}
