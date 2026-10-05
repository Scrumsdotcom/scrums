import "./ComplianceRow.css";

export interface ComplianceRowProps {
  label: string;
  sub: string;
  href?: string;
}

export function ComplianceRow({ label, sub, href }: ComplianceRowProps) {
  const inner = (
    <>
      <span className="ds-comprow__diamond" aria-hidden="true" />
      <span className="ds-comprow__body">
        <span className="ds-comprow__label">{label}</span>
        <span className="ds-comprow__sub">{sub}</span>
      </span>
      {href ? <span className="ds-comprow__arrow" aria-hidden="true">↗</span> : null}
    </>
  );
  return href ? (
    <a className="ds-comprow" href={href}>{inner}</a>
  ) : (
    <div className="ds-comprow ds-comprow--static">{inner}</div>
  );
}
