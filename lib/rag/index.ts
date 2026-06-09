// RAG legal-aware. La app por defecto usa FULL-CONTEXT (mete el expediente entero en el LLM,
// más preciso para un caso). Este módulo es para cuando ESCALES:
//  - expediente enorme que no cabe en contexto  → ragRetrieve (híbrido en memoria)
//  - buscar across muchos casos / cartera        → upsertCaso/queryCaso (Pinecone)
// En todos los casos el FOLIO viaja en los metadatos → la cita sigue anclada.
import { chunkExpediente } from "./chunk";
import { MemoryStore } from "./store";

export async function ragRetrieve(texto: string, query: string, k = 5) {
  const chunks = chunkExpediente(texto);
  const store = new MemoryStore(chunks);
  await store.index();
  const hits = await store.retrieve(query, k);
  return {
    totalChunks: chunks.length,
    modo: store.hibrido ? "híbrido (BM25 + vector, RRF)" : "BM25 léxico (agrega OPENAI_API_KEY para el vector)",
    hits: hits.map((h) => ({
      folio: h.chunk.folio || "—",
      pieza: h.chunk.pieza,
      score: Number(h.score.toFixed(4)),
      texto: h.chunk.text.slice(0, 500),
    })),
  };
}

export { chunkExpediente } from "./chunk";
export { MemoryStore } from "./store";
export { upsertCaso, queryCaso } from "./pinecone";
