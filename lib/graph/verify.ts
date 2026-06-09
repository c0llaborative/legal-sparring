// Guard determinista de grounding (nodo Verificador).
// ¿La cita que el LLM dice tomar del expediente, realmente está ahí?

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// substring exacto (normalizado) o fuzzy por solape de palabras significativas.
export function citaEnTexto(cita: string, texto: string, umbral = 0.78): boolean {
  const c = norm(cita), t = norm(texto);
  if (!c) return false;
  if (t.includes(c)) return true;
  const words = c.split(" ").filter((w) => w.length > 3);
  if (words.length < 2) return false;
  const tset = new Set(t.split(" "));
  const hit = words.filter((w) => tset.has(w)).length;
  return hit / words.length >= umbral;
}

export interface Verificacion {
  total: number;
  verificadas: number;
  sinSoporte: string[]; // descripción de las citas que NO se encontraron en el expediente
  ratio: number;
}

// Recorre todas las citas que dicen provenir del EXPEDIENTE (no las normas, que son texto legal externo).
export function verificarCitas(analysis: any, expediente: string): Verificacion {
  const items: { label: string; textual: string }[] = [];
  for (const h of analysis.hechos || []) if (h?.soporte?.textual) items.push({ label: `hecho ${h.id} (fol. ${h.soporte.folio})`, textual: h.soporte.textual });
  for (const c of analysis.contradicciones || []) {
    if (c?.citaA?.textual) items.push({ label: `contradicción · ${c.citaA.pieza} fol. ${c.citaA.folio}`, textual: c.citaA.textual });
    if (c?.citaB?.textual) items.push({ label: `contradicción · ${c.citaB.pieza} fol. ${c.citaB.folio}`, textual: c.citaB.textual });
  }
  for (const q of analysis.interrogatorio || []) if (q?.soporte?.textual) items.push({ label: `interrogatorio (hecho ${q.hechoId})`, textual: q.soporte.textual });
  for (const i of analysis.insights || []) if (i?.fuente?.textual) items.push({ label: `insight ${i.id}`, textual: i.fuente.textual });

  const sinSoporte: string[] = [];
  for (const it of items) if (!citaEnTexto(it.textual, expediente)) sinSoporte.push(it.label);

  const total = items.length;
  const verificadas = total - sinSoporte.length;
  return { total, verificadas, sinSoporte, ratio: total ? verificadas / total : 1 };
}
