// Orquestación con LangGraph.js:
// extracción → estrategia → evaluación → verificador → (reintenta estrategia | fin)
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { extraccionNode, estrategiaNode, evaluacionNode, verificadorNode, routeAfterVerify, ensamblar, type GState } from "./nodes";
import { MODELO } from "./llm";
import { redactPIIAsync } from "../redaction";
import type { CaseAnalysis, Lado } from "../types";

const S = Annotation.Root({
  expediente: Annotation<string>(),
  lado: Annotation<string>(),
  base: Annotation<any>({ reducer: (_x, y) => y, default: () => ({}) }),
  estrategia: Annotation<any>({ reducer: (_x, y) => y, default: () => ({}) }),
  evaluacion: Annotation<any>({ reducer: (_x, y) => y, default: () => ({}) }),
  verificacion: Annotation<any>({ reducer: (_x, y) => y, default: () => null }),
  intentos: Annotation<number>({ reducer: (_x, y) => y, default: () => 0 }),
});

const compiled = new StateGraph(S)
  .addNode("nodoExtraccion", extraccionNode as any)
  .addNode("nodoEstrategia", estrategiaNode as any)
  .addNode("nodoEvaluacion", evaluacionNode as any)
  .addNode("nodoVerificador", verificadorNode as any)
  .addEdge(START, "nodoExtraccion")
  .addEdge("nodoExtraccion", "nodoEstrategia")
  .addEdge("nodoEstrategia", "nodoEvaluacion")
  .addEdge("nodoEvaluacion", "nodoVerificador")
  .addConditionalEdges("nodoVerificador", routeAfterVerify as any, { estrategia: "nodoEstrategia", fin: END })
  .compile();

export async function runGraph(texto: string, lado: Lado): Promise<CaseAnalysis> {
  const { redacted } = await redactPIIAsync(texto);
  const final = (await compiled.invoke({ expediente: redacted, lado })) as GState;
  const a = ensamblar(final) as CaseAnalysis;
  a.ladoPropio = lado;
  a.meta = { modelo: `${MODELO} · grafo`, piiRedactado: true };
  (a as any).verificacion = final.verificacion;
  return a;
}
