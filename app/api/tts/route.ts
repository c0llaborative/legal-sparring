import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Voz del adversario: ElevenLabs (si hay key) → si no, el cliente usa speechSynthesis del navegador.
export async function POST(req: NextRequest) {
  const { texto } = await req.json();
  const input = String(texto || "").slice(0, 1500);

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const voice = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F";
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: "POST",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.4, similarity_boost: 0.8 },
        }),
      });
      if (r.ok) return new Response(Buffer.from(await r.arrayBuffer()), { headers: { "Content-Type": "audio/mpeg" } });
    } catch { /* cae al fallback del navegador */ }
  }
  return new Response(JSON.stringify({ error: "no-tts" }), { status: 400, headers: { "Content-Type": "application/json" } });
}
