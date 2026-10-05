import "./NotificationBar.css";

export interface NotificationBarProps {
  message?: string;
  linkLabel?: string;
  href?: string;
  build?: string;
  uptime?: string;
  statusLabel?: string;
  statusHref?: string;
  showStatus?: boolean;
  sticky?: boolean;
}

export function NotificationBar({
  message = "AI Agent Gateway now orchestrating across the SDLC",
  linkLabel = "read the brief",
  href = "/platform/ai-gateway",
  uptime = "99.999%",
  statusLabel = "All Systems Operational",
  statusHref = "https://status.scrums.com",
  showStatus = true,
  sticky = false,
}: NotificationBarProps) {
  const status = (
    <>
      <span className="ds-notif__dot" aria-hidden="true" />
      {statusLabel}
    </>
  );
  return (
    <div className={`ds-notif${sticky ? " ds-notif--sticky" : ""}`} role="status">
      {showStatus &&
        (statusHref ? (
          <a className="ds-notif__status ds-notif__status--link" href={statusHref}>
            {status}
          </a>
        ) : (
          <span className="ds-notif__status">{status}</span>
        ))}
      <span className="ds-notif__sep" aria-hidden="true">
        ·
      </span>
      <span className="ds-notif__msg">
        {message}
        {linkLabel ? (
          <>
            {" "}
            <a className="ds-notif__link" href={href}>
              {linkLabel} ↗
            </a>
          </>
        ) : null}
      </span>
      <span className="ds-notif__readouts">
        <span>
          uptime <b>{uptime}</b>
        </span>
      </span>
    </div>
  );
}
