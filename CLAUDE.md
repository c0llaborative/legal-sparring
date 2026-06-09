# CLAUDE.md — Legal Sparring

Contexto del proyecto para agentes de IA (Claude Code) y desarrolladores que editen este repo.

## Qué es
Legal Sparring: app web que, a partir del expediente de un caso, reconstruye la teoría del caso del adversario y prepara la audiencia (Código General del Proceso, Colombia). **No resume: anticipa al adversario.** Hecha para el Hackathon LegalTech (reto Esguerra JHR). Marca JSTH.

## Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind (mínimo) + CSS propio (Design System en `app/globals.css`)
- LLM vía **OpenRouter** (API compatible con OpenAI), modelo configurable (`OPENROUTER_MODEL`)
- Voz: Web Speech API (STT, navegador, Chrome) + ElevenLabs (TTS) → fallback `speechSynthesis`
- Documentos: `pdf-parse` + `mammoth` en `/api/extract`
- Estado: React + `localStorage` (sin DB, sin auth)

## Cómo correr
```
npm install
cp .env.example .env.local     # poner OPENROUTER_API_KEY para IA en vivo
npm run dev                    # localhost:3000 (Chrome para la voz)
```
Para el demo sin keys: usar los casos de muestra.

**TRAMPA CONOCIDA:** no correr `next build` mientras `next dev` está vivo — corrompe la caché `.next` (`Cannot find module './948.js'`). Solución: `rm -rf .next && npm run dev`.

## Arquitectura del razonamiento
Expediente → `redactPII` (anonimiza) → OpenRouter con salida JSON (`response_format: json_object`) → se parsea al contrato **`CaseAnalysis`** → la UI consume el contrato. El contrato es la fuente de verdad: si cambias `lib/types.ts`, actualiza también el shape JSON en `lib/prompts.ts`.

## Archivos clave
| Archivo | Rol |
|---|---|
| `lib/types.ts` | El contrato `CaseAnalysis` (todo cuelga de aquí) |
| `lib/prompts.ts` | System maestro (CREAC + CGP + grounding) + el shape JSON que debe devolver el LLM + el prompt del sparring |
| `lib/anthropic.ts` | Cliente OpenRouter: `analizarExpediente`, `sparTurno` |
| `lib/sample.ts` | 3 casos pre-horneados (SAMPLES: seguros, laboral, construcción) |
| `lib/scoring.ts` | Scores deterministas (`scoreKit`, `scoreSalaRoja`) |
| `lib/redaction.ts` | Anonimizador PII (regex) |
| `lib/history.ts` | Historial de scores en localStorage |
| `app/api/{analyze,spar,tts,extract,status}/route.ts` | Endpoints (Node runtime) |
| `components/Workspace.tsx` | Shell + tabs + vistas (Resumen, Diagnóstico, Insights, Kit, Sala Roja, Guía) |
| `components/{Sparring,Grafo,ScorePanel,Guia,Tip}.tsx` | Componentes |
| `app/globals.css` | Design System (tokens, animaciones). El token `--ease` DEBE estar en `:root` (si falta, los `.reveal` quedan invisibles). |

## Reglas de oro (no romper)
- **Grounding obligatorio:** toda norma con cita textual; todo hecho con soporte (folio). Si no está en el expediente, NO se afirma.
- **Vocabulario CGP correcto:** carga de la prueba, confesión presunta (art. 205), conducencia, art. 167, etc.
- **Cero invención.** El sistema propone; el abogado valida y firma.
- **Animaciones:** solo `transform`/`opacity`; respetar `prefers-reduced-motion`.
- **No commitear `.env.local`** (tiene las API keys; está en `.gitignore`).

## Cómo agregar un caso de muestra
Crear un objeto `CaseAnalysis` en `lib/sample.ts` y agregarlo al array `SAMPLES`. Seguir el patrón de los existentes: ~6 hechos (uno con `gapProbatorio`, uno con `cargaDinamica`), una **contradicción** con su pregunta asertiva, `insights` en lenguaje simple, `documentosFicticios`, `problemaJuridico`, `pretensiones`/`excepciones`.

## Arquitectura avanzada (montada en el repo, opt-in)
Tres subsistemas para subir de MVP a producción:

### 1. Orquestación — LangGraph.js con verificador (`lib/graph/`)
- `graph.ts`: StateGraph de 4 nodos: **extracción → estrategia → evaluación → verificador → (reintenta estrategia | fin)**.
- `nodes.ts`: cada nodo produce una parte del `CaseAnalysis` vía OpenRouter (`llm.ts`).
- `verify.ts`: guard determinista de grounding (`citaEnTexto`) — comprueba que cada cita exista literalmente en el expediente; si >35% no se sostienen, el grafo **regenera la estrategia** (1 reintento) avisándole al nodo qué citas fallaron.
- Se activa con `POST /api/analyze { texto, lado, modo: "grafo" }`. Sin `modo` = una sola llamada (`analizarExpediente`, más rápido). El resultado trae `verificacion: { total, verificadas, sinSoporte }`.

### 2. RAG legal-aware (`lib/rag/`) — para escalar
- Default de la app: **full-context** (mete el expediente entero al LLM); más preciso para un caso.
- `chunk.ts`: chunking con **folio y pieza en metadata** (la cita sigue anclada). `bm25.ts`: léxico. `embeddings.ts`: vector (OpenAI, opcional). `store.ts`: híbrido BM25+vector con **RRF**.
- `pinecone.ts`: adaptador para buscar across **muchos casos** (cartera).
- Demo: `POST /api/rag { texto, query, k }` → top-k chunks con su folio.
- Cuándo usarlo: expediente que no cabe en contexto, o búsqueda en cartera. **No** es el path por defecto.

### 3. Anonimización — Presidio NER local (`presidio/`)
- Microservicio FastAPI (Presidio + spaCy ES + recognizers de cédula/NIT) que reemplaza PII por tokens reversibles `[TIPO_n]`.
- `lib/redaction.ts` → `redactPIIAsync` lo usa si `PRESIDIO_URL` está definido; si no, cae al regex local (`redactPII`).
- Correr: `cd presidio && docker build -t ls-presidio . && docker run -p 8088:8088 ls-presidio`, y poner `PRESIDIO_URL=http://localhost:8088` en `.env.local`.

## Convenciones
- Español neutro en la UI y el contenido jurídico.
- Componentes en `components/` ("use client" donde haya estado/efectos).
- Estilos: clases semánticas en `globals.css` (no Tailwind verboso en el JSX).
- Trabajar en ramas + Pull Request; no pushear directo a `main`.
