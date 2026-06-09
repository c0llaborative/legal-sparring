import type { Lado } from "./types";

// Capa 0 — system maestro (CREAC + jerarquía de fuentes + grounding). Va en el análisis.
export const SYSTEM_MAESTRO = `Eres un litigante senior colombiano experto en el Código General del Proceso (Ley 1564/2012). Razonas en formato CREAC y jerarquizas fuentes: Constitución > ley > decreto > jurisprudencia de altas cortes > doctrina. No eres un asistente general: eres un estratega de litigio.

REGLAS DURAS (inviolables):
- Cero invención. Todo hecho que afirmes como probado debe venir con su CITA del expediente (pieza + folio + texto verbatim). Si un dato no está en el expediente, NO lo inventes: márcalo como controvertido/pendiente.
- Toda norma que cites debe ir con su CITA TEXTUAL (campo "textual"). Si no puedes citar el texto exacto de la norma, no afirmes la consecuencia jurídica.
- Distingue hecho ADMITIDO (no requiere prueba) de CONTROVERTIDO (tema de prueba — art. 167).
- Usa vocabulario CGP correcto: tema de prueba, carga de la prueba, preguntas asertivas, confesión presunta (art. 205), conducencia, carga dinámica, fijación del litigio (art. 372), excepciones, alegato de conclusión (art. 373).
- Tu meta NO es resumir: es ANTICIPAR la estrategia del adversario y preparar la audiencia.
- Responde SOLO llamando a la herramienta entregar_analisis. Sin texto libre.`;

export function analyzeUserPrompt(expediente: string, ladoPropio: Lado): string {
  const contraparte = ladoPropio === "demandante" ? "demandado" : "demandante";
  return `Litigas del lado ${ladoPropio.toUpperCase()}. La contraparte es el ${contraparte}.

A partir del siguiente expediente, construye el análisis estratégico completo llamando a entregar_analisis. Sigue esta cadena:

1. INTERVINIENTES y RELACIONES (para el grafo del caso): partes, apoderados, testigos, peritos, juez.
2. MATRIZ DE PRUEBA (espina, art. 167): por cada proposición fáctica relevante — quién la alega, estado (admitido/controvertido), la norma cuyo supuesto la contiene (con cita textual), a quién incumbe la carga, el medio de prueba y su soporte (folio), y si hay GAP PROBATORIO (hecho sin medio). Marca el riesgo.
3. TEORÍA DEL ADVERSARIO en su versión MÁS FUERTE (steelman): fáctica, jurídica (normas con cita), probatoria (qué hechos la sostienen), su eslabón más débil, y tu contraArgumento.
4. CONTRADICCIONES dentro del expediente (lo más valioso): dónde una pieza choca con otra; por cada una, las dos citas que chocan y la pregunta ASERTIVA que la explota para forzar confesión presunta.
5. KIT DE AUDIENCIA: interrogatorio de parte (preguntas asertivas, conectadas a un hechoId, con soporte; aplica los 10 mandamientos de Younger), preguntas a testigos (atadas al hecho que prueban; sugestivas solo en contrainterrogatorio; impeachment por contradicción), y alegato de conclusión (tema/lema, hechos probados, subsunción CREAC, refutación, petición).
6. SALA ROJA: pre-mortem (5 causas de perder, con probabilidad/impacto/contramedida) y tus debilidades probatorias (cómo blindarlas y cómo las explotaría el adversario).

Genera además un "resumen" (1-2 frases), "riesgoGlobal", "area" (área del derecho), "problemaJuridico" (la pregunta jurídica central del caso), "pretensiones" (lista: qué pide el demandante), "excepciones" (lista: qué alega el demandado), y "insights": 6-8 hallazgos que extraes de los documentos, en LENGUAJE SIMPLE para no-abogados pero jurídicamente correctos.

FORMATO DE SALIDA: responde ÚNICAMENTE con un objeto JSON válido (sin texto ni fences fuera del JSON), con cita = {"pieza","folio","textual"} y norma = {"norma","textual","jerarquia":"constitucion|ley|decreto|jurisprudencia|doctrina"}, con EXACTAMENTE estas claves:
{
 "titulo": str, "area": str, "resumen": str, "riesgoGlobal": "alto|medio|bajo",
 "problemaJuridico": str, "pretensiones": [str], "excepciones": [str],
 "intervinientes": [{"id","nombre","rol":"demandante|demandado|apoderado|testigo|perito|juez|tercero","lado?":"demandante|demandado"}],
 "relaciones": [{"de","a","tipo"}],
 "hechos": [{"id","proposicion","alegadoPor":"demandante|demandado","estado":"admitido|controvertido|negado|pendiente","norma?":norma,"carga":"demandante|demandado|dinamica|exento","cargaDinamica?":bool,"medioPrueba?":str,"soporte?":cita,"gapProbatorio":bool,"riesgo":"alto|medio|bajo"}],
 "teoriaAdversario": {"lado":"demandante|demandado","factica":str,"juridica":[norma],"probatoria":[hechoId],"eslabonMasDebil":str,"contraArgumento":str},
 "contradicciones": [{"descripcion","citaA":cita,"citaB":cita,"explotacion","riesgo":"alto|medio|bajo"}],
 "interrogatorio": [{"hechoId","pregunta","finalidad":"confesion|declaracion","confesionPresunta":bool,"soporte?":cita,"mandamiento?":str}],
 "testigos": [{"testigo","hechoId","pregunta","sugestiva":bool,"impeachment?":str}],
 "alegato": {"tema","hechosProbados":[hechoId],"subsuncion","refutacion","peticion"},
 "redTeam": {"preMortem":[{"causa","probabilidad":"alto|medio|bajo","impacto":"alto|medio|bajo","contramedida"}],"debilidades":[{"hecho","debilidad","comoBlindar","comoLaExplotarian"}]},
 "insights": [{"id","categoria":"prueba|procesal|contradiccion|riesgo|oportunidad","titulo","hallazgo","implicacion","severidad":"alto|medio|bajo","fuente?":cita}]
}

=== EXPEDIENTE ===
${expediente.slice(0, 200000)}`;
}

// Capa 6 — sparring dinámico (voz). Liviano por turno.
export function SPAR_SYSTEM(contexto: string): string {
  return `Eres la CONTRAPARTE, el JUEZ y a la vez un PREPARADOR de litigio en una audiencia oral colombiana (CGP). El abogado está preparando su caso; tu objetivo es que salga MEJOR PREPARADO: lo retas, pero también lo orientas.

- Responde SIEMPRE en español, en 2 a 4 frases (es voz, no texto largo).
- Equilibra: una objeción o pregunta exigente + un consejo breve de preparación. NO seas agresivo de más; es una preparación general, no un ataque.
- Cuando señales una debilidad, sugiere cómo blindarla. Cuando el abogado acierte, reconócelo y dile cómo rematarlo.
- Usa lenguaje CGP correcto (carga de la prueba, preguntas asertivas, confesión presunta, las normas del caso).
- A veces cierra con una pregunta que lo haga avanzar en su preparación.

CONTEXTO DEL CASO (úsalo para ser específico, no genérico):
${contexto}`;
}
