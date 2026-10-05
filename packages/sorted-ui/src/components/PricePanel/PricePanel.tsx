import "./PricePanel.css";

import type { ReactNode } from "react";

export interface PricePanelProps {
  statusLabel?: string;
  code?: string;
  priceNote?: string;
  price?: string;
  note?: string;
  children?: ReactNode;
}

export function PricePanel({
  statusLabel = "available now",
  code = "AGT-0142",
  priceNote = "starting price",
  price = "USD 4,800",
  note,
  children,
}: PricePanelProps) {
  return (
    <section className="ds-pricepanel">
      {statusLabel ? (
        <header className="ds-pricepanel__status">
          <span className="ds-pricepanel__state">
            <span className="ds-pricepanel__dot" aria-hidden="true" />
            {statusLabel}
          </span>
          {code ? <span className="ds-pricepanel__code">{code}</span> : null}
        </header>
      ) : null}

      <div className="ds-pricepanel__body">
        {priceNote ? <span className="ds-pricepanel__note">{priceNote}</span> : null}
        <p className="ds-pricepanel__price">{price}</p>
        {children ? <div className="ds-pricepanel__actions">{children}</div> : null}
        {note ? <p className="ds-pricepanel__fine">{note}</p> : null}
      </div>
    </section>
  );
}
