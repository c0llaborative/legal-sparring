"use client";
import type { ReactNode } from "react";

// Tooltip de guía (legal design): pasa el cursor sobre la estrella ✦ y explica en simple.
export default function Tip({ text, children }: { text: ReactNode; children?: ReactNode }) {
  return (
    <span className="tip" tabIndex={0}>
      {children ?? <span className="tip-star">✦</span>}
      <span className="tip-box">{text}</span>
    </span>
  );
}
