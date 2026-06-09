// Embeddings (mitad "semántica" del retriever). Opcional: requiere OPENAI_API_KEY.
// Sin key, el retriever cae a BM25-only (igual funciona, solo léxico).
import OpenAI from "openai";

export const embeddingsDisponibles = () => !!process.env.OPENAI_API_KEY;

export async function embed(texts: string[]): Promise<number[][] | null> {
  if (!process.env.OPENAI_API_KEY || texts.length === 0) return null;
  try {
    const client = new OpenAI();
    const r = await client.embeddings.create({ model: "text-embedding-3-small", input: texts });
    return r.data.map((d) => d.embedding as number[]);
  } catch {
    return null;
  }
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
