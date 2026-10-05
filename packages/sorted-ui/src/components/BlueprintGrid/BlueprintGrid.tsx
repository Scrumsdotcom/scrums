import "./BlueprintGrid.css";

import type { CSSProperties } from "react";

export interface BlueprintGridProps {
  tone?: "light" | "dark";
  cell?: number;
  maskAt?: string;
}

export function BlueprintGrid({ tone = "light", cell = 40, maskAt = "86% 40%" }: BlueprintGridProps) {
  const line = tone === "dark" ? "rgba(255,255,255,.08)" : "var(--hair-2)";
  const style = {
    backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
    backgroundSize: `${cell}px ${cell}px`,
    WebkitMaskImage: `radial-gradient(ellipse 80% 70% at ${maskAt}, #000 30%, transparent 80%)`,
    maskImage: `radial-gradient(ellipse 80% 70% at ${maskAt}, #000 30%, transparent 80%)`,
  } as CSSProperties;
  return <div className="ds-blueprint" aria-hidden="true" style={style} />;
}
