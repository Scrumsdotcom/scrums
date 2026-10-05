import "./Breadcrumb.css";

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items?: Crumb[];
}

const DEFAULT_ITEMS: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Resources", href: "/resources" },
  { label: "Field Notes", href: "/resources/field-notes" },
  { label: "Reading delivery as telemetry" },
];

export function Breadcrumb({ items = DEFAULT_ITEMS }: BreadcrumbProps) {
  const trail = items.filter((c) => Boolean(c.label));
  return (
    <nav className="ds-crumb" aria-label="Breadcrumb">
      <ol className="ds-crumb__list">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li className="ds-crumb__item" key={`${c.label}-${i}`}>
              {i > 0 ? (
                <span className="ds-crumb__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              {last || !c.href ? (
                <span className="ds-crumb__current" aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              ) : (
                <a className="ds-crumb__link" href={c.href}>
                  {c.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
