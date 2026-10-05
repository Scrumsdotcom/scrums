import "./BenefitCard.css";

export interface BenefitCardProps {
  title: string;
  description?: string | null;
}

export function BenefitCard({ title, description }: BenefitCardProps) {
  return (
    <div className="ds-benefit">
      <div className="ds-benefit__head">
        <span className="ds-benefit__check" aria-hidden="true">✓</span>
        <span className="ds-benefit__title">{title}</span>
      </div>
      {description ? <p className="ds-benefit__desc">{description}</p> : null}
    </div>
  );
}
