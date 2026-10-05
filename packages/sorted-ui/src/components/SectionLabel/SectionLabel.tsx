import "./SectionLabel.css";

export interface SectionLabelProps {
  index?: string;
  label?: string;
  sub?: string;
  coordinate?: string;
  variant?: "section" | "mark";
}

export function SectionLabel({
  index = "01",
  label = "What you get",
  sub,
  coordinate,
  variant = "section",
}: SectionLabelProps) {
  if (variant === "mark") {
    return (
      <div className="ds-seclabel ds-seclabel--mark">
        <span className="ds-seclabel__mark">{label}</span>
        {coordinate ? <span className="ds-seclabel__coord">{coordinate}</span> : null}
      </div>
    );
  }
  return (
    <header className="ds-seclabel ds-seclabel--section">
      <div className="ds-seclabel__row">
        <div className="ds-seclabel__lead">
          {index ? <span className="ds-seclabel__index">{index}</span> : null}
          <h2 className="ds-seclabel__title">{label}</h2>
        </div>
        {coordinate ? <span className="ds-seclabel__coord">{coordinate}</span> : null}
      </div>
      {sub ? <p className="ds-seclabel__sub">{sub}</p> : null}
    </header>
  );
}
