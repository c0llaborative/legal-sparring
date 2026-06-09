// Helper LLM compartido por los nodos del grafo (OpenRouter, salida JSON).
import OpenAI from "openai";

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

function client() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "https://legal-sparring.app", "X-Title": "Legal Sparring" },
  });
}
const strip = (s: string) => s.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "").trim();

export async function jsonCall(system: string, user: string, maxTokens = 6000): Promise<any> {
  const res = await client().chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = res.choices?.[0]?.message?.content || "{}";
  try { return JSON.parse(strip(raw)); } catch { return {}; }
}

export const MODELO = MODEL;
