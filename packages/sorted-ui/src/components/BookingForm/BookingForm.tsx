import "./BookingForm.css";

export interface BookingDay {
  value: string;
  weekday: string;
  date: string;
}

export interface BookingFormProps {
  panelTitle?: string;
  panelMeta?: string;
  days: BookingDay[];
  slots: string[];
  tz?: string;
  teamSizes?: string[];
  action?: string;
  submitLabel?: string;
  reassurance?: string;
}

export function BookingForm({
  panelTitle = "schedule your demo",
  panelMeta = "3 quick steps",
  days,
  slots,
  tz = "SAST (GMT+2)",
  teamSizes = ["1–10 engineers", "11–50 engineers", "51–200 engineers", "200+ engineers"],
  action = "#",
  submitLabel = "Book a demo →",
  reassurance = "No sales spam · reply within 2 hours · cancel anytime",
}: BookingFormProps) {
  return (
    <div className="ds-booking">
      <div className="ds-booking__head">
        <span className="ds-booking__heads">
          <span className="ds-booking__dot" aria-hidden="true" />
          {panelTitle}
        </span>
        <span className="ds-booking__meta">{panelMeta}</span>
      </div>

      <form className="ds-booking__form" method="post" action={action}>
        <fieldset className="ds-booking__step">
          <legend className="ds-booking__legend">01 · Pick a day</legend>
          <div className="ds-booking__days">
            {days.map((d, i) => (
              <label className="ds-booking__pill ds-booking__pill--day" key={d.value}>
                <input type="radio" name="day" value={d.value} defaultChecked={i === 0} required />
                <span className="ds-booking__wd">{d.weekday}</span>
                <span className="ds-booking__md">{d.date}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ds-booking__step">
          <legend className="ds-booking__legend">
            02 · Pick a time <span className="ds-booking__tz">· {tz}</span>
          </legend>
          <div className="ds-booking__slots">
            {slots.map((s, i) => (
              <label className="ds-booking__pill ds-booking__pill--slot" key={s}>
                <input type="radio" name="slot" value={s} defaultChecked={i === 0} required />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ds-booking__step">
          <legend className="ds-booking__legend">03 · Your details</legend>
          <div className="ds-booking__grid">
            <label className="ds-booking__field">
              <span className="ds-booking__label">Full name</span>
              <input
                className="ds-booking__input"
                type="text"
                name="name"
                placeholder="Jane Cooper"
                autoComplete="name"
                required
              />
            </label>
            <label className="ds-booking__field">
              <span className="ds-booking__label">Work email</span>
              <input
                className="ds-booking__input"
                type="email"
                name="email"
                placeholder="jane@company.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="ds-booking__field">
              <span className="ds-booking__label">Company</span>
              <input
                className="ds-booking__input"
                type="text"
                name="company"
                placeholder="Acme Inc."
                autoComplete="organization"
              />
            </label>
            <label className="ds-booking__field">
              <span className="ds-booking__label">Team size</span>
              <div className="ds-booking__selwrap">
                <select className="ds-booking__input ds-booking__select" name="team_size">
                  {teamSizes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <span className="ds-booking__caret" aria-hidden="true">▾</span>
              </div>
            </label>
          </div>
        </fieldset>

        <button className="ds-booking__submit" type="submit">
          {submitLabel}
        </button>
        <div className="ds-booking__reassure">
          <span className="ds-booking__ok" aria-hidden="true">✓</span> {reassurance}
        </div>
      </form>
    </div>
  );
}
