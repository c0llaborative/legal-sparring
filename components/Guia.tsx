"use client";
import type { ReactNode } from "react";

const I = {
  resumen: "M4 6h16M4 12h10M4 18h7",
  diagnostico: "M5 7a2 2 0 100-4 2 2 0 000 4zM5 21a2 2 0 100-4 2 2 0 000 4zM19 14a2 2 0 100-4 2 2 0 000 4zM7 5h7a3 3 0 013 3v2M7 19h5",
  insights: "M9 18h6M10 22h4M12 2a7 7 0 00-4 12c.6.6 1 1.4 1 2h6c0-.6.4-1.4 1-2a7 7 0 00-4-12z",
  kit: "M9 3h6l1 3h3v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h3l1-3zM9 12h6M9 16h4",
  sparring: "M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3",
  salaroja: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function Modulo({ icon, n, nombre, que, para, como }: { icon: string; n: string; nombre: string; que: string; para: string; como: ReactNode }) {
  return (
    <div className="guia-card reveal">
      <div className="guia-head"><span className="guia-ic"><Icon d={icon} /></span><div><div className="guia-n">{n}</div><h4>{nombre}</h4></div></div>
      <p className="p"><strong>Qué es.</strong> {que}</p>
      <p className="p"><strong>Para qué sirve.</strong> {para}</p>
      <p className="p"><strong>Cómo usarlo.</strong> {como}</p>
    </div>
  );
}

export default function Guia() {
  return (
    <div>
      <div className="eyebrow">guía · cómo funciona</div>
      <h2 className="h-title">Tu entrenador, en <em>simple</em></h2>
      <p className="lead">Esta herramienta lee el expediente de un caso y te prepara para la audiencia: reconstruye lo que va a argumentar la contraparte y te arma el plan. Todo apoyado en el documento real (cada dato dice de qué folio sale), en lenguaje del Código General del Proceso.</p>

      <div className="guia-steps">
        <div className="guia-step"><b>1</b><div><h4>Carga el caso</h4><p>Elige un caso de muestra o adjunta los documentos de tu expediente (PDF, Word o texto).</p></div></div>
        <div className="guia-step"><b>2</b><div><h4>Revisa el análisis</h4><p>El sistema arma el mapa del caso, los hallazgos y el plan de audiencia. Recorre los módulos del menú izquierdo.</p></div></div>
        <div className="guia-step"><b>3</b><div><h4>Entrénate y mide</h4><p>Practica en el Sparring por voz, mira tus puntajes en Kit y Sala Roja, y ve cómo mejoras caso a caso.</p></div></div>
      </div>

      <div className="kicker" style={{ marginTop: 22 }}>Los módulos, uno por uno</div>
      <div className="guia-grid">
        <Modulo icon={I.resumen} n="—" nombre="Resumen" que="La conclusión del caso en una frase: qué va a argumentar la contraparte y qué tan riesgoso es tu caso." para="Entender lo esencial en 10 segundos, sin leer todo el expediente." como="Es la primera pantalla. Léela y mira el semáforo de riesgo y los tres números clave." />
        <Modulo icon={I.diagnostico} n="I" nombre="Diagnóstico" que="El mapa del caso: quién es quién (grafo) y la matriz de prueba — qué hechos están en disputa, quién debe probar cada uno y con qué." para="Ver el campo de batalla: dónde está la pelea y dónde te faltan pruebas (los 'gaps')." como="Pasa el cursor sobre cada cita o norma para ver el texto exacto. Las filas en rojo son tu riesgo." />
        <Modulo icon={I.insights} n="II" nombre="Insights" que="Una tabla con los hallazgos que la IA sacó de leer todos los documentos, en lenguaje simple y con su fuente." para="Tu radar: lo que importa del expediente, sin leer cientos de folios." como="Lee la tabla; cada fila te dice qué encontró, qué significa para tu estrategia y de qué folio sale." />
        <Modulo icon={I.kit} n="III" nombre="Kit de Audiencia" que="El plan listo para la audiencia: la teoría del adversario, las preguntas de interrogatorio y a testigos, y la línea del alegato." para="Llegar a la sala con todo preparado y anclado a folio. Incluye un puntaje de qué tan listo estás." como="Úsalo como tu guion. Las contradicciones marcadas en rojo son tu mejor munición." />
        <Modulo icon={I.sparring} n="IV" nombre="Sparring" que="Una simulación: la IA juega a ser la contraparte y el juez, te objeta y te pregunta — por voz o por texto." para="Practicar tu intervención y descubrir tus puntos débiles antes de la audiencia real." como="Toca el micrófono y habla (en Chrome), o escribe. La IA te responde en voz y aprieta donde tu caso flaquea." />
        <Modulo icon={I.salaroja} n="V" nombre="Sala Roja" que="El espejo: un 'pre-mortem' que asume que ya perdiste y lista por qué, para que blindes tus debilidades." para="Anticipar cómo te van a atacar. Incluye un puntaje de defensibilidad y tu historial de mejora." como="Revisa cada debilidad y su plan de blindaje. Tu puntaje se guarda para que veas tu progreso entre casos." />
      </div>

      <div className="card" style={{ marginTop: 18, background: "var(--cyan-tint)", borderColor: "#cfe6f1" }}>
        <div className="kicker" style={{ color: "var(--cyan-ink)" }}>Por qué puedes confiar en el análisis</div>
        <p className="p"><strong>Cada afirmación trae su fuente.</strong> Si un dato no está en el expediente, el sistema no lo inventa. Cada norma viene con su cita textual y cada hecho con su folio — es evidencia que puedes defender, no una sugerencia de IA. Los documentos se anonimizan antes de procesarse.</p>
      </div>
    </div>
  );
}
