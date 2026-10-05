import "./LogoStrip.css";

export interface LogoItem {
  src: string;
  alt?: string;
  href?: string;
}

export interface LogoStripProps {
  eyebrow?: string;
  grayscale?: boolean;
  logos?: LogoItem[];
}

export function LogoStrip({ eyebrow = "DEPLOYED ACROSS", grayscale = true, logos = [] }: LogoStripProps) {
  const items = logos.filter((l) => l.src);

  return (
    <section className={`ds-logos${grayscale ? " is-gray" : ""}`}>
      <div className="ds-logos__inner">
        <span className="ds-logos__eyebrow">+ {eyebrow}</span>
        <div className="ds-logos__row">
          {items.map((l, i) => {
            const img = (
              <img className="ds-logos__img" src={l.src} alt={l.alt ?? ""} loading="lazy" />
            );
            return (
              <div key={`${l.src}-${i}`} className="ds-logos__cell">
                {l.href ? <a href={l.href}>{img}</a> : img}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
