import "./LoadMore.css";

export interface LoadMoreProps {
  step?: number;
  total?: number;
  label?: string;
  href?: string;
}

export function LoadMore({ step = 12, total = 247, label, href }: LoadMoreProps) {
  const text = label || `LOAD ${step} MORE OF ${total}`;
  const inner = (
    <>
      <span className="ds-loadmore__label">{text}</span>
      <span className="ds-loadmore__caret" aria-hidden="true">
        ↓
      </span>
    </>
  );
  if (href) {
    return (
      <a className="ds-loadmore" href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className="ds-loadmore">
      {inner}
    </button>
  );
}
