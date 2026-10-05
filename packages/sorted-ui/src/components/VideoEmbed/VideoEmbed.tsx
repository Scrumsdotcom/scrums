import "./VideoEmbed.css";

export interface VideoEmbedProps {
  embedUrl: string;
  title: string;
  posterUrl?: string | null;
  descriptor?: string | null;
  length?: string | null;
}

export function VideoEmbed({ embedUrl, title, posterUrl, descriptor, length }: VideoEmbedProps) {
  return (
    <figure className="ds-video">
      <div className="ds-video__chrome">
        <span className="ds-video__dot" aria-hidden="true" />
        <span className="ds-video__dot" aria-hidden="true" />
        <span className="ds-video__dot" aria-hidden="true" />
        {descriptor ? <span className="ds-video__label">{descriptor}</span> : null}
        {length ? <span className="ds-video__len">{length}</span> : null}
      </div>
      <div
        className="ds-video__stage"
        style={posterUrl ? { backgroundImage: `url("${posterUrl}")` } : undefined}
      >
        <span className="ds-video__tick ds-video__tick--tl" aria-hidden="true" />
        <span className="ds-video__tick ds-video__tick--tr" aria-hidden="true" />
        <span className="ds-video__tick ds-video__tick--bl" aria-hidden="true" />
        <span className="ds-video__tick ds-video__tick--br" aria-hidden="true" />
        <iframe
          className="ds-video__frame"
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </figure>
  );
}
