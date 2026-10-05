import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  href?: string;
  showIcon?: boolean;
}

export function Button({ label, variant = "primary", href, showIcon = false }: ButtonProps) {
  const cls = `ds-btn ds-btn--${variant}`;
  const content = (
    <>
      {showIcon && <span className="ds-btn__icon" aria-hidden="true" />}
      <span className="ds-btn__label">{label}</span>
    </>
  );
  return href ? (
    <a className={cls} href={href}>
      {content}
    </a>
  ) : (
    <button className={cls} type="button">
      {content}
    </button>
  );
}
