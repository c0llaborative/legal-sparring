"use client";
import { useEffect, useState } from "react";
import type { Score } from "@/lib/scoring";

const colorFor = (n: number) => (n >= 80 ? "var(--gr)" : n >= 60 ? "var(--cyan-ink)" : n >= 40 ? "var(--am)" : "var(--r)");

export default function ScorePanel({ titulo, score, sub }: { titulo: string; score: Score; sub?: string }) {
  const c = colorFor(score.total);
  const R = 52, CC = 2 * Math.PI * R;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let n = 0; const step = Math.max(1, Math.round(score.total / 28));
    const t = setInterval(() => { n = Math.min(score.total, n + step); setShown(n); if (n >= score.total) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [score.total]);
  const off = CC * (1 - shown / 100);

  return (
    <div className="card scorecard">
      <div className="score-wrap">
        <div className="gauge">
          <svg viewBox="0 0 120 120" width="118" height="118" aria-label={`Puntaje ${score.total} de 100`}>
            <circle cx="60" cy="60" r={R} className="g-bg" />
            <circle cx="60" cy="60" r={R} className="g-fg" style={{ stroke: c, strokeDasharray: CC, strokeDashoffset: off }} transform="rotate(-90 60 60)" />
          </svg>
          <div className="g-num"><b style={{ color: c }}>{shown}</b><span>/100</span></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 2 }}>{titulo}</div>
          <div className="g-nivel" style={{ color: c }}>{score.nivel}</div>
          {sub && <p className="muted" style={{ marginTop: 3, marginBottom: 8 }}>{sub}</p>}
          <div className="dims">
            {score.dims.map((d, i) => (
              <div key={i} className="dim" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="dim-top"><span>{d.label}</span><b style={{ color: colorFor(d.score) }}>{d.score}</b></div>
                <div className="dim-bar"><i style={{ width: `${d.score}%`, background: colorFor(d.score) }} /></div>
                <div className="dim-nota">{d.nota}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
