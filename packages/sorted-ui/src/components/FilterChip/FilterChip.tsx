import "./FilterChip.css";

export interface FilterChipProps {
  label?: string;
  variant?: "removable" | "count" | "plain";
  count?: number;
  active?: boolean;
  href?: string;
}

export function FilterChip({
  label = "af-cpt",
  variant = "removable",
  count,
  active = false,
  href,
}: FilterChipProps) {
  const cls = `ds-chip ds-chip--${variant}${active ? " ds-chip--active" : ""}`;
  const inner = (
    <>
      <span className="ds-chip__label">{label}</span>
      {variant === "removable" ? (
        <span className="ds-chip__x" aria-hidden="true">
          ×
        </span>
      ) : null}
      {variant === "count" && count != null ? <span className="ds-chip__count">{count}</span> : null}
    </>
  );
  if (href) {
    return (
      <a className={cls} href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={variant === "count" ? active : undefined}
      aria-label={variant === "removable" ? `Remove filter: ${label}` : undefined}
    >
      {inner}
    </button>
  );
}
