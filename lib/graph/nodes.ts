// Nodos del grafo de orquestación (LangGraph). Cada nodo produce una parte del CaseAnalysis.
import { jsonCall } from "./llm";
import { SYSTEM_MAESTRO } from "../prompts";
import { verificarCitas, type Verificacion } from "./verify";

export interface GState {
  expediente: string;
  lado: string;
  base: any;
  estrategia: any;
  evaluacion: any;
  verificacion: Verificacion | null;
  intentos: number;
}

// 1) EXTRACCIÓN — base del caso: partes, problema jurídico, matriz de prueba (grounded).
export async function extraccionNode(state: GState): Promise<Partial<GState>> {
  const contraparte = state.lado === "demandante" ? "demandado" : "demandante";
  const user = `Litigas del lado ${state.lado}. La contraparte es el ${contraparte}.
Extrae SOLO la base del caso, en JSON con estas claves (cada "soporte.textual" debe ser cita VERBATIM del expediente):
{
 "titulo": str, "area": str, "problemaJuridico": str,
 "pretensiones": [str], "excepciones": [str],
 "intervinientes": [{"id","nombre","rol":"demandante|demandado|apoderado|testigo|perito|juez|tercero","lado?":"demandante|demandado"}],
 "relaciones": [{"de","a","tipo"}],
 "hechos": [{"id","proposicion","alegadoPor":"demandante|demandado","estado":"admitido|controvertido|negado|pendiente","norma?":{"norma","textual","jerarquia":"constitucion|ley|decreto|jurisprudencia|doctrina"},"carga":"demandante|demandado|dinamica|exento","cargaDinamica?":bool,"medioPrueba?":str,"soporte?":{"pieza","folio","textual"},"gapProbatorio":bool,"riesgo":"alto|medio|bajo"}]
}
Solo JSON.

=== EXPEDIENTE ===
${state.expediente.slice(0, 180000)}`;
  const base = await jsonCall(SYSTEM_MAESTRO, user, 8000);
  return { base };
}

// 2) ESTRATEGIA — teoría del adversario, contradicciones y Kit de Audiencia (usa la matriz de hechos).
export async function estrategiaNode(state: GState): Promise<Partial<GState>> {
  const hechos = JSON.stringify(state.base?.hechos || []);
  const pista = (state.verificacion?.sinSoporte?.length)
    ? `\nATENCIÓN: en el intento anterior estas citas NO se encontraban en el expediente: ${state.verificacion.sinSoporte.join("; ")}. Esta vez usa SOLO citas verbatim que existan literalmente en el texto.`
    : "";
  const user = `Lado propio: ${state.lado}. Matriz de hechos del caso:
${hechos}${pista}

Genera la estrategia en JSON (citaA/B y soporte DEBEN ser verbatim del expediente):
{
 "teoriaAdversario": {"lado":"demandante|demandado","factica","juridica":[{"norma","textual","jerarquia"}],"probatoria":[hechoId],"eslabonMasDebil","contraArgumento"},
 "contradicciones": [{"descripcion","citaA":{"pieza","folio","textual"},"citaB":{"pieza","folio","textual"},"explotacion","riesgo":"alto|medio|bajo"}],
 "interrogatorio": [{"hechoId","pregunta","finalidad":"confesion|declaracion","confesionPresunta":bool,"soporte?":{"pieza","folio","textual"},"mandamiento?"}],
 "testigos": [{"testigo","hechoId","pregunta","sugestiva":bool,"impeachment?"}],
 "alegato": {"tema","hechosProbados":[hechoId],"subsuncion","refutacion","peticion"}
}
Solo JSON.

=== EXPEDIENTE ===
${state.expediente.slice(0, 150000)}`;
  const estrategia = await jsonCall(SYSTEM_MAESTRO, user, 8000);
  return { estrategia };
}

// 3) EVALUACIÓN — red-team, insights y resumen ejecutivo.
export async function evaluacionNode(state: GState): Promise<Partial<GState>> {
  const ctx = JSON.stringify({ hechos: state.base?.hechos, teoria: state.estrategia?.teoriaAdversario, contradicciones: state.estrategia?.contradicciones });
  const user = `Lado propio: ${state.lado}. Análisis hasta ahora:
${ctx}

Genera la evaluación final en JSON:
{
 "resumen": str, "riesgoGlobal": "alto|medio|bajo",
 "redTeam": {"preMortem":[{"causa","probabilidad":"alto|medio|bajo","impacto":"alto|medio|bajo","contramedida"}],"debilidades":[{"hecho","debilidad","comoBlindar","comoLaExplotarian"}]},
 "insights": [{"id","categoria":"prueba|procesal|contradiccion|riesgo|oportunidad","titulo","hallazgo","implicacion","severidad":"alto|medio|bajo","fuente?":{"pieza","folio","textual"}}]
}
El "hallazgo" en lenguaje simple para no-abogados pero jurídicamente correcto. Solo JSON.`;
  const evaluacion = await jsonCall(SYSTEM_MAESTRO, user, 5000);
  return { evaluacion };
}

// Ensambla el CaseAnalysis a partir del estado.
export function ensamblar(state: GState): any {
  return {
    ...(state.base || {}),
    ...(state.estrategia || {}),
    ...(state.evaluacion || {}),
    teoriasEmergentes: [],
    ladoPropio: state.lado,
  };
}

// 4) VERIFICADOR — guard de grounding determinista.
export async function verificadorNode(state: GState): Promise<Partial<GState>> {
  const a = ensamblar(state);
  const v = verificarCitas(a, state.expediente);
  return { verificacion: v, intentos: (state.intentos || 0) + 1 };
}

// Enrutado tras verificar: si demasiadas citas no se sostienen y aún no reintentamos, regenerar la estrategia.
export function routeAfterVerify(state: GState): "estrategia" | "fin" {
  const v = state.verificacion;
  if (v && v.total > 0 && v.sinSoporte.length / v.total > 0.35 && (state.intentos || 0) <= 1) return "estrategia";
  return "fin";
}
