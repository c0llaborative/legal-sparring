import type { CaseAnalysis } from "./types";

export interface Dim { label: string; score: number; nota: string }
export interface Score { total: number; nivel: string; dims: Dim[] }

const nivel = (n: number) => (n >= 80 ? "Sólido" : n >= 60 ? "Aceptable" : n >= 40 ? "Frágil" : "Crítico");
const avg = (ns: number[]) => Math.round(ns.reduce((s, n) => s + n, 0) / Math.max(ns.length, 1));

// Score del Kit de Audiencia — ¿qué tan listo estás para la audiencia? (rúbrica determinista)
export function scoreKit(a: CaseAnalysis): Score {
  const clave = a.hechos.filter((h) => h.estado === "controvertido");
  const cubiertos = new Set([...a.interrogatorio.map((q) => q.hechoId), ...a.testigos.map((q) => q.hechoId)]);
  const nCub = clave.filter((h) => cubiertos.has(h.id)).length;
  const cobertura = clave.length ? Math.round((100 * nCub) / clave.length) : 60;
  const conSoporte = a.interrogatorio.filter((q) => q.soporte).length;
  const grounding = a.interrogatorio.length ? Math.round((100 * conSoporte) / a.interrogatorio.length) : 50;
  const contra = Math.min(100, a.contradicciones.length * 50);
  const al = a.alegato;
  const alegato = Math.round(([al?.tema, al?.subsuncion, al?.refutacion, al?.peticion].filter(Boolean).length / 4) * 100);
  const dims: Dim[] = [
    { label: "Cobertura de hechos en disputa", score: cobertura, nota: `${nCub}/${clave.length} hechos con preguntas que los prueban` },
    { label: "Anclaje a folio (grounding)", score: grounding, nota: `${conSoporte}/${a.interrogatorio.length} preguntas con soporte documental` },
    { label: "Contradicciones explotadas", score: contra, nota: `${a.contradicciones.length} contradicción(es) con su pregunta` },
    { label: "Alegato de conclusión completo", score: alegato, nota: "tema · subsunción · refutación · petición" },
  ];
  const total = avg(dims.map((d) => d.score));
  return { total, nivel: nivel(total), dims };
}

// Score de Sala Roja — ¿qué tan defendible es tu caso? (paranoia profesional medida)
export function scoreSalaRoja(a: CaseAnalysis): Score {
  const nh = a.hechos.length || 1;
  const gaps = a.hechos.filter((h) => h.gapProbatorio).length;
  const solidez = Math.round(100 * (1 - gaps / nh));
  const riesgoMap: Record<string, number> = { bajo: 85, medio: 60, alto: 35 };
  const riesgo = riesgoMap[a.riesgoGlobal] ?? 60;
  const deb = a.redTeam.debilidades;
  const blindaje = deb.length ? Math.round((100 * deb.filter((d) => d.comoBlindar && d.comoBlindar.length > 10).length) / deb.length) : 70;
  const sev: Record<string, number> = { bajo: 1, medio: 2, alto: 3 };
  const pm = a.redTeam.preMortem;
  const avgRisk = pm.length ? pm.reduce((s, p) => s + sev[p.probabilidad] * sev[p.impacto], 0) / pm.length : 4;
  const control = Math.round(100 * (1 - (avgRisk - 1) / 8));
  const dims: Dim[] = [
    { label: "Solidez probatoria", score: solidez, nota: `${gaps} de ${nh} hechos sin prueba (gaps)` },
    { label: "Riesgo global del caso", score: riesgo, nota: `riesgo ${a.riesgoGlobal}` },
    { label: "Debilidades con plan de blindaje", score: blindaje, nota: `${deb.length} debilidad(es) mapeada(s)` },
    { label: "Control del pre-mortem", score: control, nota: `${pm.length} riesgos anticipados` },
  ];
  const total = avg(dims.map((d) => d.score));
  return { total, nivel: nivel(total), dims };
}
