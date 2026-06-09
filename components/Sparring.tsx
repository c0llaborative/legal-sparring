"use client";
import { useEffect, useRef, useState } from "react";
import type { CaseAnalysis } from "@/lib/types";
import Tip from "./Tip";

type Msg = { role: "user" | "assistant"; content: string };

// Diálogo de ejemplo (preparación general). Para el caso de la firma contraria/seguros, uno escrito a mano.
function ejemploDe(a: CaseAnalysis): Msg[] {
  if ((a.area || "").toLowerCase().includes("seguro") || a.titulo.includes("Cóndor")) {
    return [
      { role: "assistant", content: "Abogado, antes de la audiencia preparemos su caso con calma. En una frase, ¿cuál es su teoría?" },
      { role: "user", content: "Que la aseguradora no puede alegar reticencia: ella misma inspeccionó la bodega y conocía el riesgo." },
      { role: "assistant", content: "Buen punto de partida. Como contraparte le diré que el tomador tenía el deber de declarar sinceramente el estado del riesgo (art. 1058 C.Co). ¿Con qué prueba sostiene que la aseguradora ya lo conocía?" },
      { role: "user", content: "El acta de inspección, folio 8, donde registran los químicos y por eso ajustaron la prima." },
      { role: "assistant", content: "Ese es su mejor argumento, y es documental: difícil de negar. Remátelo con la parte final del art. 1058 — si el asegurador conocía o debía conocer, la reticencia se sanea. Una recomendación: no dependa de su testigo corredor; ancle todo en el acta. ¿Cómo cerraría su alegato?" },
      { role: "user", content: "Diría que no se puede alegar como oculto lo que ellos mismos inspeccionaron y tarifaron." },
      { role: "assistant", content: "Esa frase es su tema, úsela tal cual al cerrar. Va bien preparado: lleve el pliego de preguntas asertivas al representante legal sobre el acta, y tendrá el control de la audiencia." },
    ];
  }
  const c = a.contradicciones[0];
  const base: Msg[] = [
    { role: "assistant", content: "Abogado, preparemos su caso. En una frase, ¿cuál es su teoría?" },
    { role: "user", content: `Mi tesis se apoya en que ${a.teoriaAdversario.eslabonMasDebil.toLowerCase()}` },
    { role: "assistant", content: "Entendido. Como contraparte le pregunto: ¿con qué prueba concreta del expediente lo sostiene?" },
  ];
  if (c) {
    base.push({ role: "user", content: `Con esto: ${c.citaB.pieza}, folio ${c.citaB.folio}.` });
    base.push({ role: "assistant", content: `Buen punto, y está anclado a folio. Para la audiencia, prepárese a usarlo así: "${c.explotacion}" Va por buen camino.` });
  }
  return base;
}

function MicIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-3px", marginRight: 7 }}><path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3" /></svg>;
}

export default function Sparring({ analysis }: { analysis: CaseAnalysis }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [estado, setEstado] = useState<"idle" | "rec" | "think">("idle");
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState<{ openrouter?: boolean; elevenlabs?: boolean; modelo?: string }>({});
  const [micErr, setMicErr] = useState("");
  const [srOk, setSrOk] = useState(true);
  const recRef = useRef<any>(null);
  const finalRef = useRef("");
  const contexto = buildContexto(analysis);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
    const SR = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
    setSrOk(!!SR);
  }, []);

  async function toggleVoz() {
    if (estado === "rec") { recRef.current?.stop(); return; }
    setMicErr("");
    const SR = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);
    if (!SR) { setSrOk(false); setMicErr("Tu navegador no soporta dictado por voz. Ábrela en Chrome o Edge, o usa el modo texto."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicErr("No pudimos acceder al micrófono. Permite el micrófono en el navegador (candado de la barra de direcciones) e intenta de nuevo.");
      return;
    }
    const rec = new SR();
    rec.lang = "es-CO"; rec.interimResults = true; rec.continuous = true; finalRef.current = "";
    rec.onresult = (e: any) => {
      let it = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalRef.current += t; else it += t; }
      setTexto(finalRef.current + it);
    };
    rec.onerror = (e: any) => {
      setEstado("idle");
      const er = e?.error;
      setMicErr(er === "not-allowed" ? "Permiso de micrófono denegado." : er === "no-speech" ? "No te escuché — intenta de nuevo." : er === "audio-capture" ? "No se detecta un micrófono." : "Error de voz; usa el modo texto.");
    };
    rec.onend = () => { const t = finalRef.current.trim(); setEstado("idle"); if (t) enviar(t); };
    try { rec.start(); recRef.current = rec; setEstado("rec"); } catch { setMicErr("No se pudo iniciar el micrófono."); setEstado("idle"); }
  }

  async function enviar(content: string) {
    if (!content.trim() || estado === "think") return;
    setTexto("");
    const nuevos = [...msgs, { role: "user" as const, content }];
    setMsgs(nuevos); setEstado("think");
    let replica = "";
    try {
      const r = await fetch("/api/spar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ historia: nuevos, contexto }) });
      const d = await r.json();
      replica = d.replica || d.error || "";
    } catch { replica = "(No se pudo contactar el motor.)"; }
    if (replica) { setMsgs((m) => [...m, { role: "assistant", content: replica }]); hablar(replica); }
    setEstado("idle");
  }

  async function hablar(t: string) {
    try {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: t }) });
      if (!r.ok) throw new Error("no-tts");
      const buf = await r.arrayBuffer();
      await new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }))).play();
    } catch {
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "es-ES"; speechSynthesis.speak(u); } catch { /* sin voz */ }
    }
  }

  function cargarEjemplo() {
    const ej = ejemploDe(analysis);
    setMsgs(ej);
    hablar(ej[ej.length - 1].content.slice(0, 220));
  }

  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Legal Sparring.</b> Practica tu intervención en voz alta o por texto. La IA juega a la contraparte y al juez, pero también te orienta: te reta y te ayuda a preparar el caso — para que llegues entrenado a la audiencia.</>} /> legal sparring · entrena la audiencia</div>
      <div className="row spread">
        <h2 className="h-title">Sala de <em>audiencia</em></h2>
        <span className={`statuspill ${status.openrouter ? "on" : "off"}`}>{status.openrouter ? `IA activa · ${status.modelo}` : "Modo demo · agrega OPENROUTER_API_KEY"}</span>
      </div>
      <p className="help">Háblale al micrófono (en Chrome) o escribe. La IA te responde en voz {status.elevenlabs ? "(ElevenLabs)" : "(voz del navegador)"} y te prepara el caso de forma general, sin presionar de más.</p>

      {!srOk && <div className="spar-banner"><span>El dictado por voz funciona en <b>Chrome</b> o <b>Edge</b>. En este navegador, usa el modo texto de abajo, o abre la app en Chrome.</span></div>}

      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn-ghost" onClick={cargarEjemplo}>▶ Ver ejemplo simulado</button>
        {msgs.length > 0 && <button className="btn-ghost" onClick={() => { setMsgs([]); setMicErr(""); }}>Limpiar</button>}
      </div>

      <div className="spar-stage">
        {msgs.length === 0 && <div className="spar-msg ia"><div className="who">Juez / preparador</div>Abogado, lo escucho. Cuénteme su teoría del caso y con qué prueba la sostiene — o pulse «Ver ejemplo simulado» para ver cómo se vería la preparación.</div>}
        {msgs.map((m, i) => (<div key={i} className={`spar-msg ${m.role === "user" ? "yo" : "ia"}`}><div className="who">{m.role === "user" ? "Usted" : "Contraparte / Juez"}</div>{m.content}</div>))}
        {estado === "think" && <div className="spar-msg ia"><span className="spin" /> <span style={{ marginLeft: 8 }}>La contraparte prepara su respuesta…</span></div>}
        {texto && estado === "rec" && <div className="spar-msg yo"><div className="who">Usted (hablando…)</div>{texto}</div>}
      </div>
      {micErr && <p className="spar-err">{micErr}</p>}

      <div className="row" style={{ marginTop: 14 }}>
        <button className={`ptt ${estado === "rec" ? "rec" : ""}`} onClick={toggleVoz} disabled={estado === "think"} style={{ flex: "0 0 auto" }}>
          {estado === "rec" ? "● Detener y enviar" : <><MicIcon />Hablar</>}
        </button>
        <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="row" style={{ flex: 1 }}>
          <input className="field" style={{ flex: 1 }} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="…o escribe tu intervención y presiona Enter" />
          <button className="btn cyan" type="submit" disabled={estado === "think" || !texto.trim()}>Enviar</button>
        </form>
      </div>
    </div>
  );
}

function buildContexto(a: CaseAnalysis): string {
  const hc = a.hechos.filter((h) => h.estado === "controvertido").slice(0, 4).map((h) => `- ${h.proposicion}${h.gapProbatorio ? " [GAP PROBATORIO]" : ""}`).join("\n");
  const c = a.contradicciones[0];
  return `Caso: ${a.titulo}. El abogado litiga del lado ${a.ladoPropio}.
Teoría del adversario: ${a.teoriaAdversario.factica}
Eslabón más débil del abogado (puedes presionarlo, pero también orientarlo): ${a.teoriaAdversario.eslabonMasDebil}
Hechos controvertidos:
${hc}${c ? `\nContradicción clave en el expediente: ${c.descripcion}` : ""}`;
}
