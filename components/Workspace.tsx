"use client";
import { useEffect, useState } from "react";
import type { CaseAnalysis, Lado, Hecho, Cita, RiesgoNivel, Insight } from "@/lib/types";
import { SAMPLES } from "@/lib/sample";
import { scoreKit, scoreSalaRoja } from "@/lib/scoring";
import { saveHistorial, prom, type HistRec } from "@/lib/history";
import Grafo from "./Grafo";
import Sparring from "./Sparring";
import ScorePanel from "./ScorePanel";
import Guia from "./Guia";
import Tip from "./Tip";

type Tab = "guia" | "resumen" | "diagnostico" | "insights" | "kit" | "sparring" | "salaroja";

export default function Workspace() {
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [lado, setLado] = useState<Lado>("demandante");
  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hist, setHist] = useState<HistRec[]>([]);

  useEffect(() => {
    if (!analysis) return;
    const k = scoreKit(analysis), s = scoreSalaRoja(analysis);
    setHist(saveHistorial({ id: analysis.titulo, titulo: analysis.titulo, area: analysis.area, kit: k.total, salaroja: s.total }));
  }, [analysis]);

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setLoading(true); setError("");
    for (const f of Array.from(files)) {
      try {
        const fd = new FormData(); fd.append("file", f);
        const r = await fetch("/api/extract", { method: "POST", body: fd });
        const d = await r.json();
        if (r.ok && d.text) { setTexto((t) => (t ? t + "\n\n" : "") + `=== ${d.name} ===\n` + d.text); setArchivos((a) => [...a, d.name]); }
        else setError(d.error || `No se pudo leer ${f.name}`);
      } catch { setError(`Error leyendo ${f.name}`); }
    }
    setLoading(false);
  }

  async function analizar() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto, lado }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      setAnalysis(data); setTab("resumen");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }

  if (!analysis) {
    return (
      <div className="app">
        <Topbar />
        <div className="main" style={{ maxWidth: 880, margin: "0 auto" }}>
          <div className="eyebrow">empezar</div>
          <h2 className="h-title">Nuevo <em>caso</em></h2>
          <p className="help">Elige un caso de muestra para ver la app en acción, o analiza tu propio expediente: adjunta los documentos (PDF, Word o texto) o pégalos. El sistema reconstruye la teoría del adversario y prepara la audiencia.</p>

          <div className="kicker">Casos de muestra · didácticos</div>
          <div className="cases">
            {SAMPLES.map((s, i) => (
              <button key={i} className="case-card" onClick={() => { setAnalysis(s); setLado(s.ladoPropio); setTab("resumen"); }}>
                <div className="area">{s.area || "Litigio"}</div>
                <h4>{s.titulo}</h4>
                <p>{s.resumen.slice(0, 120)}…</p>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="kicker">…o analiza tu propio expediente</div>
            <label className="dropzone" style={{ display: "block" }}>
              <input type="file" multiple accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
              {loading ? <><span className="spin" /> Leyendo documentos…</> : <><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-3px", marginRight: 7 }}><path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.49" /></svg>Adjuntar documentos del expediente <span style={{ color: "var(--ink3)" }}>(PDF · Word · texto · varios a la vez)</span></>}
            </label>
            {archivos.length > 0 && <div style={{ marginTop: 4 }}>{archivos.map((n, i) => <span key={i} className="filechip">{n}</span>)}</div>}
            <textarea className="field" rows={6} style={{ marginTop: 12 }} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="…o pega aquí el texto del expediente." />
            <div className="row" style={{ marginTop: 12 }}>
              <span className="kicker" style={{ margin: 0 }}>Litigo del lado:</span>
              {(["demandante", "demandado"] as Lado[]).map((l) => (
                <button key={l} className="pill" style={lado === l ? { background: "var(--cyan-ink)", color: "#fff", borderColor: "var(--cyan-ink)" } : {}} onClick={() => setLado(l)}>{l}</button>
              ))}
              <button className="btn primary" style={{ marginLeft: "auto" }} onClick={analizar} disabled={loading || texto.length < 50}>
                {loading ? <><span className="spin" /> Analizando…</> : "Analizar con IA"}
              </button>
            </div>
            {error && <p style={{ color: "var(--r)", fontSize: 14, marginTop: 10 }}>{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const a = analysis;
  const hechoById = (id: string) => a.hechos.find((h) => h.id === id);
  const stats = {
    controvertidos: a.hechos.filter((h) => h.estado === "controvertido").length,
    gaps: a.hechos.filter((h) => h.gapProbatorio).length,
    contradicciones: a.contradicciones.length,
  };
  const TABS: { id: Tab; n: string; t: string; s: string }[] = [
    { id: "resumen", n: "—", t: "Resumen", s: "lo esencial, de un vistazo" },
    { id: "diagnostico", n: "I", t: "Diagnóstico", s: "grafo + matriz de prueba" },
    { id: "insights", n: "II", t: "Insights", s: "hallazgos de los documentos" },
    { id: "kit", n: "III", t: "Kit de Audiencia", s: "los 4 entregables" },
    { id: "sparring", n: "IV", t: "Sparring", s: "entrena por voz" },
    { id: "salaroja", n: "V", t: "Sala Roja", s: "tus debilidades + score" },
    { id: "guia", n: "?", t: "Guía", s: "cómo funciona cada módulo" },
  ];

  return (
    <div className="app">
      <Topbar caso={a.titulo} lado={a.ladoPropio} area={a.area} onReset={() => { setAnalysis(null); setTexto(""); setArchivos([]); }} />
      <div className="body">
        <nav className="tabs">
          {TABS.map((tb) => (
            <div key={tb.id} className={`tab ${tab === tb.id ? "active" : ""}`} onClick={() => setTab(tb.id)}>
              <span className="n">{tb.n}</span><div><div>{tb.t}</div><small>{tb.s}</small></div>
            </div>
          ))}
          <div className="sep" />
          <div className="tab" onClick={() => window.print()}><span className="n">↧</span><div><div>Exportar Kit</div><small>imprimir / PDF</small></div></div>
        </nav>
        <div className="main">
          <div className="view" key={tab}>
            {tab === "resumen" && <Resumen a={a} stats={stats} />}
            {tab === "diagnostico" && <Diagnostico a={a} />}
            {tab === "insights" && <Insights a={a} />}
            {tab === "kit" && <Kit a={a} hechoById={hechoById} />}
            {tab === "sparring" && <Sparring analysis={a} />}
            {tab === "salaroja" && <SalaRoja a={a} hist={hist} />}
            {tab === "guia" && <Guia />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Topbar({ caso, lado, area, onReset }: { caso?: string; lado?: Lado; area?: string; onReset?: () => void }) {
  return (
    <header className="topbar">
      <span className="brand">LEGAL<span className="dot"> · </span>SPARRING</span>
      <span className="brand-sub">preparación de audiencia · CGP</span>
      {caso && <span className="case">{area ? area + " · " : ""}{caso}</span>}
      {lado && <span className="lado">litigo: {lado}</span>}
      {onReset && <button className="lado" onClick={onReset}>Nuevo caso</button>}
    </header>
  );
}

function RBadge({ r }: { r: RiesgoNivel }) { return <span className={`risk ${r}`}>{r}</span>; }
function CitaTag({ c }: { c?: Cita }) {
  if (!c) return <span className="gap">sin soporte</span>;
  return <span className="cita" title={`"${c.textual}"`}>{c.pieza} fol. {c.folio}</span>;
}

function Resumen({ a, stats }: { a: CaseAnalysis; stats: any }) {
  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Resumen ejecutivo.</b> En una frase: qué va a argumentar la contraparte y qué tan riesgoso es tu caso. Lo más importante, de un vistazo — sin leer todo el expediente.</>} /> resumen ejecutivo</div>
      <h2 className="h-title">Teoría probable de la <em>contraparte</em></h2>
      <div className="bluf">
        <div className="row spread" style={{ alignItems: "flex-start" }}>
          <p className="conc">{a.resumen}</p>
          <span className={`risk ${a.riesgoGlobal}`} style={{ fontSize: 13, padding: "6px 14px" }}>Riesgo {a.riesgoGlobal}</span>
        </div>
        <div className="kpis">
          <div className="kpi"><div className="v">{stats.controvertidos}</div><div className="l">hechos en disputa (lo que hay que probar)</div></div>
          <div className="kpi"><div className="v">{stats.gaps}</div><div className="l">pruebas que faltan (gaps)</div></div>
          <div className="kpi"><div className="v">{stats.contradicciones}</div><div className="l">contradicciones que puedes explotar</div></div>
        </div>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card tight">
          <div className="kicker">Teoría del adversario</div>
          <p className="p">{a.teoriaAdversario.factica}</p>
          <p className="p" style={{ marginTop: 8 }}><strong>Dónde es más débil:</strong> {a.teoriaAdversario.eslabonMasDebil}</p>
        </div>
        {a.perfilContraparte && (
          <div className="card tight">
            <div className="kicker">Perfil de la contraparte</div>
            <p className="p"><strong>{a.perfilContraparte.firma}.</strong> {a.perfilContraparte.estilo}</p>
            <ul className="p" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{a.perfilContraparte.comoAnticipar.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
        )}
      </div>
      {a.documentosFicticios && a.documentosFicticios.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="kicker">Documentos del expediente analizados</div>
          {a.documentosFicticios.map((d, i) => <span key={i} className="docpill" title={d.descripcion}>{d.nombre}</span>)}
        </div>
      )}
    </div>
  );
}

function Diagnostico({ a }: { a: CaseAnalysis }) {
  const admitidos = a.hechos.filter((h) => h.estado === "admitido");
  const enDisputa = a.hechos.filter((h) => h.estado === "controvertido" || h.estado === "negado");
  const gaps = a.hechos.filter((h) => h.gapProbatorio);
  const tot = a.hechos.length || 1;
  const dem = a.intervinientes.filter((i) => i.lado === "demandante");
  const den = a.intervinientes.filter((i) => i.lado === "demandado");
  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Diagnóstico general.</b> El panorama completo del caso en una vista: el problema jurídico, qué pide cada lado, quién es quién, qué hechos están en disputa y dónde te faltan pruebas.</>} /> diagnóstico general del caso</div>
      <h2 className="h-title">Diagnóstico <em>general</em></h2>

      {a.problemaJuridico && (
        <div className="card pjcard reveal"><div className="kicker">El problema jurídico</div><p className="p" style={{ fontSize: 17, color: "var(--ink1)" }}>{a.problemaJuridico}</p></div>
      )}

      {(a.pretensiones || a.excepciones) && (
        <div className="grid2 reveal">
          <div className="card tight pcard pcard-dem">
            <div className="kicker">Demandante · qué pide</div>
            <ul className="dots">{(a.pretensiones || []).map((p, i) => <li key={i}>{p}</li>)}</ul>
            {dem.length > 0 && <div className="parts">{dem.map((i) => <span key={i.id} className="partchip">{i.nombre}<small>{i.rol}</small></span>)}</div>}
          </div>
          <div className="card tight pcard pcard-den">
            <div className="kicker">Demandado · qué excepciona</div>
            <ul className="dots">{(a.excepciones || []).map((p, i) => <li key={i}>{p}</li>)}</ul>
            {den.length > 0 && <div className="parts">{den.map((i) => <span key={i.id} className="partchip">{i.nombre}<small>{i.rol}</small></span>)}</div>}
          </div>
        </div>
      )}

      <div className="card reveal"><div className="kicker">Mapa de intervinientes — quién es quién</div><Grafo intervinientes={a.intervinientes} relaciones={a.relaciones} /></div>

      <div className="card reveal">
        <div className="kicker">Los hechos del caso, de un vistazo</div>
        <div className="hb">
          <div className="hb-stat"><b>{a.hechos.length}</b><span>hechos en total</span></div>
          <div className="hb-stat"><b style={{ color: "var(--gr)" }}>{admitidos.length}</b><span>admitidos · no se prueban</span></div>
          <div className="hb-stat"><b style={{ color: "var(--cyan-ink)" }}>{enDisputa.length}</b><span>en disputa · tema de prueba</span></div>
          <div className="hb-stat"><b style={{ color: "var(--r)" }}>{gaps.length}</b><span>sin prueba · gaps</span></div>
        </div>
        <div className="hb-bar"><i className="hg" style={{ width: `${(admitidos.length / tot) * 100}%` }} /><i className="hc" style={{ width: `${(enDisputa.length / tot) * 100}%` }} /></div>
        <div className="hb-leg"><span><i className="hg" /> admitidos</span><span><i className="hc" /> en disputa (aquí está la pelea)</span></div>
      </div>

      <div className="kicker" style={{ marginTop: 4 }}>Matriz de prueba — hecho → norma → carga → folio</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Hecho (qué se afirma)</th><th>Lo alega</th><th>Estado</th><th>Quién debe probarlo <Tip text={<><b>Carga de la prueba (art. 167 CGP).</b> Quien quiere un efecto jurídico debe probar el hecho que lo causa. <b>«Dinámica»</b> = la prueba la tiene la otra parte, el juez puede pedirle a ella que la aporte.</>} /></th><th>Norma</th><th>Prueba (folio)</th><th>Riesgo</th></tr></thead>
          <tbody>
            {a.hechos.map((h: Hecho) => (
              <tr key={h.id}>
                <td><strong>{h.id}.</strong> {h.proposicion}{h.gapProbatorio && <span className="gap"> · falta prueba</span>}</td>
                <td>{h.alegadoPor}</td>
                <td>{h.estado}</td>
                <td>{h.carga}{h.cargaDinamica && <span className="tag" style={{ marginLeft: 4 }}>dinámica</span>}</td>
                <td>{h.norma ? <span className="cita" title={`"${h.norma.textual}"`}>{h.norma.norma}</span> : "—"}</td>
                <td><CitaTag c={h.soporte} /></td>
                <td><RBadge r={h.riesgo} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="help">Pasa el cursor sobre cada cita o norma para ver el texto exacto. El semáforo y los «gaps» (pruebas que faltan) salen de una regla fija, no de una opinión del modelo.</p>
    </div>
  );
}

function Insights({ a }: { a: CaseAnalysis }) {
  const ins: Insight[] = a.insights || [];
  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Insights.</b> Lo que la IA encontró al leer todos los documentos del expediente: los hallazgos que importan, en lenguaje simple y con su fuente (folio). Tu radar del caso — sin leer cientos de folios.</>} /> insights · lo que la IA extrajo</div>
      <h2 className="h-title">Hallazgos del <em>expediente</em></h2>
      <p className="help">La IA leyó {a.documentosFicticios?.length ? `los ${a.documentosFicticios.length} documentos` : "el expediente"} y extrajo estos hallazgos clave — cada uno con qué significa para tu estrategia y de dónde sale.</p>
      {a.documentosFicticios && a.documentosFicticios.length > 0 && (
        <div style={{ marginBottom: 14 }}>{a.documentosFicticios.map((d, i) => <span key={i} className="docpill" title={d.descripcion}>{d.nombre}</span>)}</div>
      )}
      {ins.length === 0 ? <div className="card"><p className="muted">No hay insights para este caso.</p></div> : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead><tr><th>Hallazgo</th><th>Tipo</th><th>Qué significa</th><th>Fuente</th><th>Sev.</th></tr></thead>
            <tbody>
              {ins.map((x) => (
                <tr key={x.id}>
                  <td><strong>{x.titulo}.</strong> {x.hallazgo}</td>
                  <td><span className={`ins-cat ins-${x.categoria}`}>{x.categoria}</span></td>
                  <td>{x.implicacion}</td>
                  <td><CitaTag c={x.fuente} /></td>
                  <td><RBadge r={x.severidad} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kit({ a, hechoById }: { a: CaseAnalysis; hechoById: (id: string) => Hecho | undefined }) {
  const hp = (id: string) => { const h = hechoById(id); return h ? `${h.id}. ${h.proposicion}` : id; };
  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Kit de Audiencia.</b> El plan listo para la audiencia: la teoría probable del adversario, las preguntas de interrogatorio y a testigos, y la línea del alegato — todo anclado a folio. Esto es lo que te llevas a la sala.</>} /> kit de audiencia · salida esperada</div>
      <h2 className="h-title">Plan de <em>audiencia</em></h2>
      <ScorePanel titulo="Preparación de audiencia" score={scoreKit(a)} sub="Qué tan listo está tu Kit: cobertura de hechos, anclaje a folio, contradicciones y alegato." />

      {a.contradicciones.length > 0 && (
        <div className="card" style={{ borderColor: "#e7c3c3", background: "#fdf6f6" }}>
          <div className="kicker" style={{ color: "var(--r)" }}>Contradicciones en el expediente — tu munición</div>
          {a.contradicciones.map((c, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <p className="p"><strong>{c.descripcion}</strong></p>
              <div className="q-meta"><CitaTag c={c.citaA} /> ⟷ <CitaTag c={c.citaB} /></div>
              <p className="q" style={{ marginTop: 6 }}>→ {c.explotacion}</p>
            </div>
          ))}
        </div>
      )}

      <div className="kit-item">
        <h4>1 · Teoría y línea jurídica de la contraparte</h4>
        <p className="p">{a.teoriaAdversario.factica}</p>
        <div className="q-meta" style={{ marginTop: 6 }}>{a.teoriaAdversario.juridica.map((n, i) => <span key={i} className="cita" title={`"${n.textual}"`}>{n.norma}</span>)}</div>
        {a.teoriaAdversario.contraArgumento && <p className="p" style={{ marginTop: 8 }}><strong>Tu contraargumento:</strong> {a.teoriaAdversario.contraArgumento}</p>}
      </div>

      <div className="kit-item">
        <h4>2 · Interrogatorio de parte <Tip text={<><b>Preguntas asertivas.</b> Preguntas cerradas que afirman un hecho. Si el interrogado evade o no asiste, ese hecho se da por cierto: <b>confesión presunta</b> (art. 205 CGP).</>}><span className="tag">preguntas asertivas</span></Tip></h4>
        {a.interrogatorio.map((q, i) => (
          <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 10 : 0, marginTop: i ? 10 : 0 }}>
            <p className="q">“{q.pregunta}”</p>
            <div className="q-meta">
              <span title={hp(q.hechoId)}>prueba el hecho {q.hechoId}</span>
              <span>{q.finalidad}</span>
              {q.confesionPresunta && <span className="tag warn">confesión presunta (art. 205)</span>}
              {q.mandamiento && <span>Younger {q.mandamiento}</span>}
              {q.soporte && <CitaTag c={q.soporte} />}
            </div>
          </div>
        ))}
      </div>

      <div className="kit-item">
        <h4>3 · Preguntas a testigos <span className="tag">conectadas al hecho</span></h4>
        {a.testigos.map((q, i) => (
          <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", paddingTop: i ? 10 : 0, marginTop: i ? 10 : 0 }}>
            <p className="q"><strong>{q.testigo}:</strong> “{q.pregunta}”</p>
            <div className="q-meta"><span title={hp(q.hechoId)}>prueba el hecho {q.hechoId}</span><span>{q.sugestiva ? "sugestiva (contrainterrogatorio)" : "abierta (directo)"}</span></div>
            {q.impeachment && <p className="p" style={{ marginTop: 4 }}><strong>Impeachment:</strong> {q.impeachment}</p>}
          </div>
        ))}
      </div>

      <div className="kit-item">
        <h4>4 · Línea de alegato de conclusión <span className="tag">art. 373</span></h4>
        <p className="p"><strong>Tema:</strong> {a.alegato.tema}</p>
        <p className="p" style={{ marginTop: 6 }}><strong>Subsunción:</strong> {a.alegato.subsuncion}</p>
        <p className="p" style={{ marginTop: 6 }}><strong>Refutación:</strong> {a.alegato.refutacion}</p>
        <p className="p" style={{ marginTop: 6 }}><strong>Petición:</strong> {a.alegato.peticion}</p>
      </div>
    </div>
  );
}

function SalaRoja({ a, hist }: { a: CaseAnalysis; hist: HistRec[] }) {
  return (
    <div>
      <div className="eyebrow"><Tip text={<><b>Sala Roja.</b> El espejo: dónde te pueden romper a TI. Un «pre-mortem» que asume que ya perdiste y lista por qué — para que blindes tus puntos débiles antes de entrar a la sala.</>} /> sala roja · red-team</div>
      <h2 className="h-title">Tus <em>debilidades</em> antes de litigar</h2>
      <ScorePanel titulo="Defensibilidad del caso" score={scoreSalaRoja(a)} sub="Qué tan defendible es tu caso: solidez probatoria, riesgo, blindaje y control del pre-mortem." />
      <Progreso hist={hist} actual={a.titulo} />
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Por qué podríamos perder</th><th>Prob.</th><th>Impacto</th><th>Cómo blindarse</th></tr></thead>
          <tbody>
            {a.redTeam.preMortem.map((p, i) => (
              <tr key={i}><td>{p.causa}</td><td><span className={`risk ${p.probabilidad}`}>{p.probabilidad}</span></td><td><span className={`risk ${p.impacto}`}>{p.impacto}</span></td><td>{p.contramedida}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        {a.redTeam.debilidades.map((d, i) => (
          <div key={i} className="card tight">
            <div className="kicker">Debilidad · {d.hecho}</div>
            <p className="p">{d.debilidad}</p>
            <p className="p" style={{ marginTop: 6 }}><strong>Cómo blindarla:</strong> {d.comoBlindar}</p>
            <p className="p" style={{ marginTop: 6 }}><strong>Cómo la explotarían:</strong> {d.comoLaExplotarian}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Progreso({ hist, actual }: { hist: HistRec[]; actual: string }) {
  if (!hist.length) return null;
  const ord = [...hist].sort((x, y) => x.fecha - y.fecha);
  const idx = ord.findIndex((r) => r.id === actual);
  const cur = idx >= 0 ? ord[idx] : ord[ord.length - 1];
  const prev = idx > 0 ? ord[idx - 1] : null;
  const delta = prev ? prom(cur) - prom(prev) : 0;
  return (
    <div className="card">
      <div className="kicker">Tu progreso · {hist.length} caso(s) evaluado(s)</div>
      {prev && <p className="p" style={{ marginBottom: 10 }}>{delta >= 0 ? `Vas mejorando: +${delta} puntos` : `${delta} puntos`} frente a tu caso anterior ({prev.titulo}).</p>}
      <div className="prog-rows">
        {ord.map((r, i) => (
          <div key={i} className={`prog-row ${r.id === actual ? "on" : ""}`}>
            <span className="prog-name">{r.titulo}{r.id === actual && <span className="tag" style={{ marginLeft: 8 }}>actual</span>}</span>
            <span className="prog-chip">Kit {r.kit}</span>
            <span className="prog-chip">Defensa {r.salaroja}</span>
            <div className="prog-track"><i style={{ width: `${prom(r)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
