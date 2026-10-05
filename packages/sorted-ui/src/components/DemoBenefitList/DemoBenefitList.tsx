import "./DemoBenefitList.css";

export interface DemoBenefit {
  h: string;
  p: string;
}

export interface DemoBenefitListProps {
  items: DemoBenefit[];
}

export function DemoBenefitList({ items }: DemoBenefitListProps) {
  return (
    <div className="ds-demobenefits">
      {items.map((b, i) => (
        <div className="ds-demobenefits__item" key={i}>
          <span className="ds-demobenefits__check" aria-hidden="true">✓</span>
          <div>
            <div className="ds-demobenefits__h">{b.h}</div>
            <div className="ds-demobenefits__p">{b.p}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
