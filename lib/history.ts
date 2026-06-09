// Historial local (localStorage) de casos evaluados → ver cómo vas mejorando.
export interface HistRec { id: string; titulo: string; area?: string; fecha: number; kit: number; salaroja: number }
const KEY = "el_historial_v1";

export function getHistorial(): HistRec[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveHistorial(rec: Omit<HistRec, "fecha">): HistRec[] {
  const list = getHistorial();
  const full: HistRec = { ...rec, fecha: Date.now() };
  const i = list.findIndex((r) => r.id === rec.id);
  if (i >= 0) list[i] = { ...full, fecha: list[i].fecha }; else list.push(full);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* sin storage */ }
  return list;
}

// Promedio (kit+salaroja)/2 de un registro, para la tendencia.
export const prom = (r: HistRec) => Math.round((r.kit + r.salaroja) / 2);
