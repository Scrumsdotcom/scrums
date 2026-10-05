import "./RewardOfferCard.css";

export interface RewardOfferCardProps {
  ticketTitle: string;
  ticketDescription?: string | null;
  includes?: string[];
  regions?: string | null;
  categories?: string | null;
  claimLabel?: string;
  claimHref: string;
  note?: string | null;
}

export function RewardOfferCard({
  ticketTitle,
  ticketDescription,
  includes = [],
  regions,
  categories,
  claimLabel = "Claim this reward →",
  claimHref,
  note,
}: RewardOfferCardProps) {
  return (
    <div className="ds-offercard">
      <div className="ds-offercard__head">
        <div className="ds-offercard__eyebrow">// your reward</div>
        <div className="ds-offercard__title">{ticketTitle}</div>
        {ticketDescription ? <div className="ds-offercard__sub">{ticketDescription}</div> : null}
      </div>
      <div className="ds-offercard__body">
        {includes.length > 0 ? (
          <>
            <div className="ds-offercard__label">Includes</div>
            <div className="ds-offercard__includes">
              {includes.map((i, idx) => (
                <div className="ds-offercard__inc" key={idx}>
                  <span className="ds-offercard__plus" aria-hidden="true">+</span>
                  <span>{i}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {regions ? (
          <div className="ds-offercard__row">
            <span className="ds-offercard__rowk">Regions</span>
            <b className="ds-offercard__rowv">{regions}</b>
          </div>
        ) : null}
        {categories ? (
          <div className="ds-offercard__row">
            <span className="ds-offercard__rowk">Categories</span>
            <b className="ds-offercard__rowv">{categories}</b>
          </div>
        ) : null}
        <a className="ds-offercard__claim" href={claimHref} target="_blank" rel="sponsored noopener noreferrer">
          {claimLabel}
        </a>
        {note ? <p className="ds-offercard__note">{note}</p> : null}
      </div>
    </div>
  );
}
