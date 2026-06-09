// BM25 (keyword) en JS puro — la mitad "léxica" del retriever híbrido.
// Lo legal es muy de palabra clave (números de artículo, nombres), por eso no basta el vector.

const STOP = new Set("de la el en y a los las un una que del al se por con su para es no o e".split(" "));

export function tokenize(s: string): string[] {
  return (s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]+/g) || [])
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export class BM25 {
  private docs: string[][];
  private df = new Map<string, number>();
  private avgdl = 0;
  private N: number;
  private k1 = 1.5;
  private b = 0.75;

  constructor(texts: string[]) {
    this.docs = texts.map(tokenize);
    this.N = this.docs.length || 1;
    let total = 0;
    for (const doc of this.docs) {
      total += doc.length;
      for (const t of new Set(doc)) this.df.set(t, (this.df.get(t) || 0) + 1);
    }
    this.avgdl = total / this.N;
  }

  score(query: string): number[] {
    const q = tokenize(query);
    return this.docs.map((doc) => {
      const dl = doc.length || 1;
      const tf = new Map<string, number>();
      for (const t of doc) tf.set(t, (tf.get(t) || 0) + 1);
      let s = 0;
      for (const t of q) {
        const f = tf.get(t);
        if (!f) continue;
        const idf = Math.log(1 + (this.N - (this.df.get(t) || 0) + 0.5) / ((this.df.get(t) || 0) + 0.5));
        s += idf * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + this.b * (dl / this.avgdl))));
      }
      return s;
    });
  }
}
