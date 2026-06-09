"use client";
import type { Interviniente, Relacion } from "@/lib/types";

const W = 820, H = 380, BW = 152, BH = 46;
const X = { demandante: 150, centro: 410, demandado: 670 } as const;

export default function Grafo({ intervinientes, relaciones }: { intervinientes: Interviniente[]; relaciones: Relacion[] }) {
  const cols = {
    demandante: intervinientes.filter((i) => i.lado === "demandante"),
    centro: intervinientes.filter((i) => i.lado !== "demandante" && i.lado !== "demandado"),
    demandado: intervinientes.filter((i) => i.lado === "demandado"),
  };
  const pos: Record<string, { x: number; y: number }> = {};
  (["demandante", "centro", "demandado"] as const).forEach((c) => {
    const arr = cols[c];
    const gap = (H - 90) / (arr.length + 1);
    arr.forEach((n, idx) => { pos[n.id] = { x: X[c], y: 64 + gap * (idx + 1) }; });
  });
  const cls = (i: Interviniente) =>
    i.lado === "demandante" ? "node-dem" : i.lado === "demandado" ? "node-dom" : "node-juez";

  return (
    <svg className="grafo" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <text x={X.demandante} y={34} textAnchor="middle" className="node-role">Demandante</text>
      <text x={X.demandado} y={34} textAnchor="middle" className="node-role">Demandado</text>
      {relaciones.map((r, k) => {
        const a = pos[r.de], b = pos[r.a];
        if (!a || !b) return null;
        return (
          <g key={k}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="edge" />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" className="edge-label">{r.tipo}</text>
          </g>
        );
      })}
      {intervinientes.map((i) => {
        const p = pos[i.id];
        if (!p) return null;
        return (
          <g key={i.id}>
            <rect x={p.x - BW / 2} y={p.y - BH / 2} width={BW} height={BH} rx={10} className={`node-box ${cls(i)}`} />
            <text x={p.x} y={p.y - 1} textAnchor="middle" className="node-label">{trunc(i.nombre, 22)}</text>
            <text x={p.x} y={p.y + 13} textAnchor="middle" className="node-role">{i.rol}</text>
          </g>
        );
      })}
    </svg>
  );
}
function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
