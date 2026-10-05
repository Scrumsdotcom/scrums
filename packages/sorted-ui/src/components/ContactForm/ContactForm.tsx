import type { FormEvent } from "react";
import "./ContactForm.css";

export interface ContactFormProps {
  eyebrow?: string;
  heading?: string;
  sub?: string;
  submitLabel?: string;
  action?: string;
  showCompany?: boolean;
  showMessage?: boolean;
}

export function ContactForm({
  eyebrow = "[SEC-09] CONTACT // DEPLOY",
  heading = "Deploy with an operator",
  sub = "Tell us what you're building. An operator routes you to the right region and pod, usually within a business day.",
  submitLabel = "Deploy",
  action = "",
  showCompany = true,
  showMessage = true,
}: ContactFormProps) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!action) e.preventDefault();
  };

  return (
    <section className="ds-form">
      <div className="ds-form__inner">
        <div className="ds-form__copy">
          <span className="ds-form__eyebrow">{eyebrow}</span>
          <h2 className="ds-form__title">{heading}</h2>
          {sub ? <p className="ds-form__sub">{sub}</p> : null}
          <ul className="ds-form__meta">
            <li>
              <span className="ds-form__dot" aria-hidden="true" />
              ALL SYSTEMS OPERATIONAL
            </li>
            <li>RESPONSE ≤ 1 BUSINESS DAY</li>
            <li>us-east · eu-lon · af-cpt</li>
          </ul>
        </div>

        <form className="ds-form__form" action={action || undefined} method="post" onSubmit={onSubmit}>
          <label className="ds-form__field">
            <span className="ds-form__label">Name</span>
            <input className="ds-form__input" type="text" name="name" required autoComplete="name" />
          </label>
          <label className="ds-form__field">
            <span className="ds-form__label">Work email</span>
            <input className="ds-form__input" type="email" name="email" required autoComplete="email" />
          </label>
          {showCompany ? (
            <label className="ds-form__field">
              <span className="ds-form__label">Company</span>
              <input className="ds-form__input" type="text" name="company" autoComplete="organization" />
            </label>
          ) : null}
          {showMessage ? (
            <label className="ds-form__field">
              <span className="ds-form__label">Message</span>
              <textarea className="ds-form__input ds-form__textarea" name="message" rows={4} />
            </label>
          ) : null}
          <button className="ds-form__submit" type="submit">
            {submitLabel} →
          </button>
        </form>
      </div>
    </section>
  );
}
