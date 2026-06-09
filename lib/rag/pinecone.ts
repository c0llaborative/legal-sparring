// Adaptador Pinecone — para ESCALA de cartera (buscar across muchos casos).
// Requiere PINECONE_API_KEY (+ OPENAI_API_KEY para embeddings). El folio va en metadata.
import type { Chunk } from "./chunk";
import { embed } from "./embeddings";

export async function upsertCaso(indexName: string, casoId: string, chunks: Chunk[]): Promise<number> {
  if (!process.env.PINECONE_API_KEY) throw new Error("Falta PINECONE_API_KEY");
  const vecs = await embed(chunks.map((c) => c.text));
  if (!vecs) throw new Error("Faltan embeddings (OPENAI_API_KEY) para indexar en Pinecone");
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const index = new Pinecone().index(indexName);
  await index.namespace(casoId).upsert(
    chunks.map((c, i) => ({
      id: `${casoId}-${c.id}`,
      values: vecs[i],
      metadata: { texto: c.text.slice(0, 1000), pieza: c.pieza, folio: c.folio, casoId },
    }))
  );
  return chunks.length;
}

export async function queryCaso(indexName: string, casoId: string, query: string, k = 5) {
  if (!process.env.PINECONE_API_KEY) throw new Error("Falta PINECONE_API_KEY");
  const qv = (await embed([query]))?.[0];
  if (!qv) throw new Error("Faltan embeddings (OPENAI_API_KEY)");
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const index = new Pinecone().index(indexName);
  const res = await index.namespace(casoId).query({ vector: qv, topK: k, includeMetadata: true });
  return (res.matches || []).map((m) => ({
    score: m.score,
    folio: (m.metadata as any)?.folio,
    pieza: (m.metadata as any)?.pieza,
    texto: (m.metadata as any)?.texto,
  }));
}
