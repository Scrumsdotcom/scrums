import "./UsageRow.css";

export interface UsageRowProps {
  name: string;
  blurb?: string;
  price: string;
  unit: string;
  tag?: string;
}

export function UsageRow({
  name,
  blurb,
  price,
  unit,
  tag = "Billed on consumption",
}: UsageRowProps) {
  return (
    <div className="ds-usagerow">
      <span className="ds-usagerow__tag">
        <span className="ds-usagerow__dot" aria-hidden="true" />
        {tag}
      </span>
      <h3 className="ds-usagerow__name">{name}</h3>
      {blurb ? <p className="ds-usagerow__blurb">{blurb}</p> : null}
      <div className="ds-usagerow__foot">
        <span className="ds-usagerow__from">from</span>
        <span className="ds-usagerow__price">{price}</span>
        <span className="ds-usagerow__unit">{unit}</span>
      </div>
    </div>
  );
}
