// Cliente LLM vía OpenRouter (OpenAI-compatible). Una sola key (OPENROUTER_API_KEY),
// modelo configurable (OPENROUTER_MODEL). Razonamiento del análisis + turnos de sparring.
import OpenAI from "openai";
import { redactPII } from "./redaction";
import { SYSTEM_MAESTRO, analyzeUserPrompt, SPAR_SYSTEM } from "./prompts";
import type { CaseAnalysis, Lado } from "./types";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

function client() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://entrenador-litigios.app",
      "X-Title": "Entrenador de Litigios",
    },
  });
}

function stripFences(s: string) {
  return s.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
}

export async function analizarExpediente(texto: string, ladoPropio: Lado): Promise<CaseAnalysis> {
  const { redacted } = redactPII(texto);
  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_MAESTRO },
      { role: "user", content: analyzeUserPrompt(redacted, ladoPropio) },
    ],
  });
  const raw = res.choices?.[0]?.message?.content || "{}";
  let data: Partial<CaseAnalysis> = {};
  try { data = JSON.parse(stripFences(raw)); } catch { data = {}; }
  return {
    intervinientes: [], relaciones: [], hechos: [], teoriasEmergentes: [],
    contradicciones: [], interrogatorio: [], testigos: [],
    ...data,
    ladoPropio,
    meta: { modelo: MODEL, piiRedactado: true },
  } as CaseAnalysis;
}

export type SparMsg = { role: "user" | "assistant"; content: string };

export async function sparTurno(historia: SparMsg[], contexto: string): Promise<string> {
  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 350,
    messages: [
      { role: "system", content: SPAR_SYSTEM(contexto) },
      ...historia.map((m) => ({ role: m.role, content: m.content })),
    ],
  });
  return res.choices?.[0]?.message?.content || "";
}
