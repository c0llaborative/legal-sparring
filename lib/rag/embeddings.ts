// Embeddings (mitad "semántica" del retriever). Dos proveedores, en orden:
//   1) OpenAI text-embedding-3-small  (si OPENAI_API_KEY)
//   2) Pinecone hosted inference       (si PINECONE_API_KEY) — no necesita OpenAI
// Sin ninguno, el retriever cae a BM25-only (igual funciona, solo léxico).
import OpenAI from "openai";

export const embeddingsDisponibles = () => !!process.env.OPENAI_API_KEY || !!process.env.PINECONE_API_KEY;
const PC_MODEL = process.env.PINECONE_EMBED_MODEL || "multilingual-e5-large"; // 1024 dims, multilingüe (ES)

export async function embed(texts: string[], inputType: "passage" | "query" = "passage"): Promise<number[][] | null> {
  if (texts.length === 0) return null;

  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI();
      const r = await client.embeddings.create({ model: "text-embedding-3-small", input: texts });
      return r.data.map((d) => d.embedding as number[]);
    } catch { /* intenta Pinecone */ }
  }

  if (process.env.PINECONE_API_KEY) {
    try {
      const { Pinecone } = await import("@pinecone-database/pinecone");
      const pc = new Pinecone();
      const res: any = await pc.inference.embed(PC_MODEL, texts, { inputType, truncate: "END" });
      return (res.data as any[]).map((d) => d.values as number[]);
    } catch { return null; }
  }

  return null;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
