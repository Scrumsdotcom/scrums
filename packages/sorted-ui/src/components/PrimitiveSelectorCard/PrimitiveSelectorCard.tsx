import "./PrimitiveSelectorCard.css";

export interface PrimitiveSelectorCardProps {
  label?: string;
  descriptor?: string;
  mark?: string;
  count?: number;
  active?: boolean;
  href?: string;
}

export function PrimitiveSelectorCard({
  label = "Agents",
  descriptor = "Autonomous operators that run a task end-to-end",
  mark = "01",
  count,
  active = false,
  href = "#",
}: PrimitiveSelectorCardProps) {
  const hasCount = typeof count === "number" && !Number.isNaN(count);
  return (
    <a
      className={`ds-prim${active ? " ds-prim--active" : ""}`}
      href={href}
      aria-current={active ? "true" : undefined}
    >
      <span className="ds-prim__top">
        {mark ? (
          <span className="ds-prim__mark" aria-hidden="true">
            {mark}
          </span>
        ) : null}
        {hasCount ? <span className="ds-prim__count">{count}</span> : null}
      </span>
      <span className="ds-prim__label">{label}</span>
      {descriptor ? <span className="ds-prim__descriptor">{descriptor}</span> : null}
      <span className="ds-prim__action" aria-hidden="true">
        OPEN →
      </span>
    </a>
  );
}
