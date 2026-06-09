# Legal Sparring

**Sparring de litigio asistido por IA.** A partir del expediente de un caso, reconstruye la teoría del caso de la contraparte y prepara la audiencia (Código General del Proceso colombiano) — **todo anclado a folio** (cero alucinación) y en lenguaje del CGP.

> No resume el expediente: **anticipa la estrategia del adversario.**

Construido para el Hackathon LegalTech (reto Esguerra JHR). Marca: JSTH (Juan Torres).

---

## Arranque rápido

```bash
npm install
cp .env.example .env.local      # opcional: solo para análisis en vivo / voz
npm run dev                     # http://localhost:3000  (usa Chrome para la voz)
```

**Demo sin ninguna API key:** abre la app → elige un **caso de muestra** (Seguros / Laboral / Construcción). Renderiza el análisis completo al instante.

**Análisis en vivo:** pon `OPENROUTER_API_KEY` en `.env.local`, adjunta o pega un expediente y "Analizar con IA".

> ⚠️ No corras `next build` mientras `next dev` está vivo — corrompe la caché `.next` (`Cannot find module './948.js'`). Si pasa: `rm -rf .next && npm run dev`.

---

## Módulos

| Módulo | Qué entrega |
|---|---|
| **Resumen (BLUF)** | Teoría probable de la contraparte + semáforo de riesgo + KPIs |
| **Diagnóstico** | Problema jurídico, qué pide cada lado, grafo de intervinientes y **matriz de prueba** (hecho→norma→carga→folio) |
| **Insights** | Hallazgos que la IA extrae de los documentos, en lenguaje simple |
| **Kit de Audiencia** | (1) teoría del adversario, (2) interrogatorio asertivo, (3) preguntas a testigos, (4) alegato — con **score** de preparación |
| **Sparring** | La IA juega contraparte/juez por **voz** o texto; te objeta y te prepara |
| **Sala Roja** | Pre-mortem + debilidades + **score** de defensibilidad + **historial** de progreso |
| **Guía** | Explicación de cada módulo dentro de la app |

## Diferenciadores

- **Grounding al expediente:** cada afirmación trae su cita (pieza + folio + texto verbatim); cada norma trae su cita textual — el candado anti-alucinación.
- **Detección de contradicciones:** encuentra dónde el expediente se contradice y genera la pregunta asertiva que lo explota (confesión presunta, art. 205).
- **CGP nativo:** tema de prueba, carga (dinámica), conducencia, fijación del litigio, alegato de conclusión.
- **Privacidad:** anonimizador PII local (`lib/redaction.ts`) antes de enviar al LLM.

---

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind + Design System propio (JSTH). **LLM vía OpenRouter** (configurable, default `anthropic/claude-sonnet-4.5`). Voz: **Web Speech API** (STT, navegador) + **ElevenLabs** (TTS) con fallback a `speechSynthesis`. Documentos: `pdf-parse` + `mammoth`. Estado: React + `localStorage`. Sin DB ni auth — demo-first, listo para Vercel.

## Arquitectura

```
Expediente (PDF/Word/texto) → [redactPII] → OpenRouter (salida JSON estructurada)
        → CaseAnalysis (el contrato, lib/types.ts) → la UI consume el contrato

app/api/analyze   expediente → análisis estructurado (CaseAnalysis)
app/api/spar      turno de sparring
app/api/tts       voz del adversario (ElevenLabs → fallback navegador)
app/api/extract   PDF/Word → texto
app/api/status    qué keys están activas (para el indicador de la UI)
lib/types.ts      el contrato CaseAnalysis (fuente de verdad)
lib/prompts.ts    cadena de razonamiento (CREAC + CGP + grounding)
lib/anthropic.ts  cliente OpenRouter
lib/sample.ts     3 casos pre-horneados (demo sin API)
lib/scoring.ts    scores deterministas (Kit, Sala Roja)
components/        Workspace (tabs) · Diagnóstico · Kit · Sparring · Grafo · ScorePanel · Guia
```

## Variables de entorno (`.env.local`, NO se commitea)

```
OPENROUTER_API_KEY=...                         # motor (análisis + sparring)
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5   # configurable
ELEVENLABS_API_KEY=...                          # voz (opcional; tier gratis sirve)
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB        # voz válida en tier gratis (Adam)
```

## Arquitectura avanzada (montada, opt-in)

Tres subsistemas listos para subir de MVP a producción (detalle en [`CLAUDE.md`](CLAUDE.md)):

- **Orquestación · LangGraph.js + verificador** (`lib/graph/`): el análisis se descompone en un grafo de nodos (extracción → estrategia → evaluación → **verificador**) con un guard de grounding que **regenera** si las citas no se sostienen en el expediente. Se activa con `POST /api/analyze { ..., modo: "grafo" }`.
- **RAG legal-aware** (`lib/rag/`): full-context por defecto; para escalar, retriever **híbrido BM25 + vector (RRF)** con **folio en metadata**, y adaptador **Pinecone** para cartera. Demo en `POST /api/rag`.
- **Anonimización · Presidio NER local** (`presidio/`): microservicio FastAPI (spaCy ES + cédula/NIT) que reemplaza PII antes del LLM; la app lo usa vía `PRESIDIO_URL` con fallback al regex.

## Deploy

Listo para **Vercel** (`vercel`). Configura las env vars en el dashboard de Vercel. El gateway Presidio se despliega aparte (Docker).

---

Más para desarrolladores en [`CLAUDE.md`](CLAUDE.md) · explicación en simple en [`LEEME.md`](LEEME.md).
