import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Extrae texto de un documento adjunto (.pdf / .docx / .txt) para alimentar el análisis.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();
    let text = "";
    if (name.endsWith(".pdf")) {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as any;
      text = (await pdfParse(buf)).text;
    } else if (name.endsWith(".docx")) {
      const mammoth: any = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else {
      text = buf.toString("utf-8");
    }
    return NextResponse.json({ text: (text || "").trim(), name: file.name });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No se pudo extraer el texto" }, { status: 500 });
  }
}
