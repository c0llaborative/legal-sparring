// Anonimizador PII local (regex) — corre ANTES de enviar el expediente al LLM.
// Capa de confianza/privacidad: "no entrenamos con tus datos". Reversible vía el mapa.

export interface Redaction { redacted: string; map: Record<string, string> }

export function redactPII(text: string): Redaction {
  const map: Record<string, string> = {};
  let i = 0;
  const tok = (kind: string, val: string) => {
    const existing = Object.entries(map).find(([, v]) => v === val);
    if (existing) return existing[0];
    const t = `[${kind}_${++i}]`;
    map[t] = val;
    return t;
  };
  let out = text;
  // emails
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, (m) => tok("EMAIL", m));
  // cédulas / NIT (7-12 dígitos, con o sin puntos)
  out = out.replace(/\b\d{1,3}(?:[.\s]\d{3}){2,3}\b/g, (m) => tok("ID", m));
  out = out.replace(/\b\d{7,12}\b/g, (m) => tok("ID", m));
  // teléfonos con prefijo
  out = out.replace(/\+?\d[\d\s().-]{6,}\d/g, (m) => (m.length >= 7 ? tok("TEL", m) : m));
  return { redacted: out, map };
}

// Re-expande tokens en un texto de salida (por si el usuario quiere ver los datos reales en su pantalla).
export function rehydrate(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [t, v] of Object.entries(map)) out = out.split(t).join(v);
  return out;
}
