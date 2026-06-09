// Chunking legal-aware: divide el expediente por unidad estructural (pieza/folio)
// y conserva el folio y la pieza en los METADATOS — así la cita sigue anclada.
export interface Chunk { id: string; text: string; pieza: string; folio: string }

export function chunkExpediente(text: string, maxChars = 1200): Chunk[] {
  const chunks: Chunk[] = [];
  let pieza = "expediente";
  let folio = "";
  let buf = "";
  let n = 0;
  const flush = () => {
    const t = buf.trim();
    if (t) chunks.push({ id: `c${++n}`, text: t, pieza, folio });
    buf = "";
  };
  for (const line of text.split(/\r?\n/)) {
    const mPieza = line.match(/^\s*=+\s*(.+?)\s*=+\s*$/);                 // "=== Contestación ==="
    const mFolio = line.match(/\[p[aá]g\.?\s*(\d+)/i) || line.match(/\bfol(?:io)?\.?\s*(\d+)/i);
    if (mPieza) { flush(); pieza = mPieza[1].slice(0, 50); folio = ""; continue; }
    if (mFolio) folio = mFolio[1];
    buf += line + "\n";
    if (buf.length >= maxChars) flush();
  }
  flush();
  return chunks;
}
