import "./BillingToggle.css";

export interface BillingToggleProps {
  monthlyLabel?: string;
  annualLabel?: string;
  defaultValue?: "monthly" | "annual";
  saveLabel?: string;
}

export function BillingToggle({
  monthlyLabel = "Monthly",
  annualLabel = "Annual",
  defaultValue = "annual",
  saveLabel,
}: BillingToggleProps) {
  return (
    <div className="ds-billtoggle">
      <div className="ds-billtoggle__seg" role="group" aria-label="Billing cycle">
        <button
          type="button"
          className={`ds-billtoggle__opt${defaultValue === "monthly" ? " is-active" : ""}`}
          data-billing="monthly"
          aria-pressed={defaultValue === "monthly"}
        >
          {monthlyLabel}
        </button>
        <button
          type="button"
          className={`ds-billtoggle__opt${defaultValue === "annual" ? " is-active" : ""}`}
          data-billing="annual"
          aria-pressed={defaultValue === "annual"}
        >
          {annualLabel}
        </button>
      </div>
      {saveLabel ? <span className="ds-billtoggle__save">{saveLabel}</span> : null}
    </div>
  );
}
