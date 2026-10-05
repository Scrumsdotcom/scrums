import "./CapabilityTile.css";

export interface CapabilityTileProps {
  name?: string;
  count?: number;
  noun?: string;
  from?: string;
  href?: string;
}

export function CapabilityTile({
  name = "Backend services",
  count = 38,
  noun = "agents",
  from = "from $4.8k",
  href = "#",
}: CapabilityTileProps) {
  return (
    <a className="ds-captile" href={href}>
      <span className="ds-captile__arrow" aria-hidden="true">
        ↗
      </span>
      <span className="ds-captile__glyph" aria-hidden="true">
        <span className="ds-captile__glyph-dot" />
      </span>
      <span className="ds-captile__name">{name}</span>
      <span className="ds-captile__foot">
        <span className="ds-captile__count">
          <span className="ds-captile__count-num">{count}</span>
          {noun ? ` ${noun}` : null}
        </span>
        {from ? <span className="ds-captile__from">{from}</span> : null}
      </span>
    </a>
  );
}
