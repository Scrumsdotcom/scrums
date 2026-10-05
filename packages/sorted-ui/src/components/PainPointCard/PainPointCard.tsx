import "./PainPointCard.css";

export interface PainPointCardProps {
  title: string;
  description?: string | null;
  index?: string | null;
}

export function PainPointCard({ title, description, index }: PainPointCardProps) {
  return (
    <div className="ds-painpoint">
      <div className="ds-painpoint__head">
        <span className="ds-painpoint__mark" aria-hidden="true">
          <span className="ds-painpoint__diamond" />
        </span>
        {index ? <span className="ds-painpoint__idx">{index}</span> : null}
      </div>
      <h3 className="ds-painpoint__title">{title}</h3>
      {description ? <p className="ds-painpoint__desc">{description}</p> : null}
    </div>
  );
}
