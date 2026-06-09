// Retriever híbrido en memoria: BM25 (léxico) + embeddings (semántico), fusionados con RRF.
import type { Chunk } from "./chunk";
import { BM25 } from "./bm25";
import { embed, cosine } from "./embeddings";

export interface Hit { chunk: Chunk; score: number }

const rankIdx = (scores: number[]): number[] =>
  scores.map((s, i) => [i, s] as [number, number]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);

export class MemoryStore {
  chunks: Chunk[];
  private bm25: BM25;
  private vectors: number[][] | null = null;
  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    this.bm25 = new BM25(chunks.map((c) => c.text));
  }
  async index() { this.vectors = await embed(this.chunks.map((c) => c.text)); }
  get hibrido() { return !!this.vectors; }

  async retrieve(query: string, k = 5): Promise<Hit[]> {
    const bmRank = rankIdx(this.bm25.score(query));
    let vecRank: number[] | null = null;
    if (this.vectors) {
      const qv = (await embed([query], "query"))?.[0];
      if (qv) vecRank = rankIdx(this.vectors.map((v) => cosine(qv, v)));
    }
    // Reciprocal Rank Fusion
    const rrf = new Map<number, number>();
    const add = (rank: number[] | null) => { if (rank) rank.forEach((idx, pos) => rrf.set(idx, (rrf.get(idx) || 0) + 1 / (60 + pos))); };
    add(bmRank);
    add(vecRank);
    return [...rrf.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([idx, score]) => ({ chunk: this.chunks[idx], score }));
  }
}
