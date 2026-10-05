import "./CommandHero.css";

import type { ReactNode } from "react";

export interface CommandHeroProps {
  coordLeft?: string;
  coordRight?: string;
  eyebrow?: string;
  eyebrowTail?: string;
  lead?: string;
  title?: string;
  subhead?: string;
  popular?: string[];
  children?: ReactNode;
}

export function CommandHero({
  coordLeft = "AGENTS // CATALOG",
  coordRight = "SECTOR 04 · GRID 64",
  eyebrow = "AI AGENTS",
  eyebrowTail = "Browse · Filter · Deploy",
  lead = "Deploy a",
  title = "production agent",
  subhead = "Every agent is a typed, priced, deployable record — built for humans, queryable by machines.",
  popular = ["Backend", "Data pipelines", "Support", "QA"],
  children,
}: CommandHeroProps) {
  return (
    <section className="ds-cmdhero">
      <span className="ds-cmdhero__grid" aria-hidden="true" />
      <span className="ds-cmdhero__rings" aria-hidden="true">
        <span className="ds-cmdhero__ring ds-cmdhero__ring--1" />
        <span className="ds-cmdhero__ring ds-cmdhero__ring--2" />
        <span className="ds-cmdhero__ring ds-cmdhero__ring--3" />
        <span className="ds-cmdhero__sweep" />
      </span>

      <div className="ds-cmdhero__inner">
        <div className="ds-cmdhero__coords">
          <span>
            <span className="ds-cmdhero__plus">+</span> {coordLeft}
          </span>
          {coordRight ? (
            <span className="ds-cmdhero__coord-right">
              <span className="ds-cmdhero__plus">+</span> {coordRight}
            </span>
          ) : null}
        </div>

        <div className="ds-cmdhero__eyebrow">
          {eyebrow ? <span className="ds-cmdhero__pill">{eyebrow}</span> : null}
          {eyebrowTail ? <span className="ds-cmdhero__eyebrow-tail">{eyebrowTail}</span> : null}
        </div>

        <h1 className="ds-cmdhero__title">
          <span className="ds-cmdhero__lead">{lead}</span> {title}
          <span className="ds-cmdhero__cursor" aria-hidden="true" />
        </h1>

        {subhead ? <p className="ds-cmdhero__subhead">{subhead}</p> : null}

        {children ? <div className="ds-cmdhero__slot">{children}</div> : null}

        {popular.length ? (
          <div className="ds-cmdhero__popular">
            <span className="ds-cmdhero__popular-label">Popular:</span>
            {popular.map((p, i) => (
              <span className="ds-cmdhero__chip" key={`${p}-${i}`}>
                {p}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
