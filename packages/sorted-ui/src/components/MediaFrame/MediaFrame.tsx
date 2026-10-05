import "./MediaFrame.css";

export interface MediaFrameProps {
  videoUrl?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  label?: string;
}

export function MediaFrame({ videoUrl, imageUrl, imageAlt, label = "Preview" }: MediaFrameProps) {
  if (!videoUrl && !imageUrl) return null;
  return (
    <figure className="ds-mediaframe">
      <div className="ds-mediaframe__frame">
        {videoUrl ? (
          <iframe
            className="ds-mediaframe__media"
            src={videoUrl}
            title={imageAlt || "Product preview"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img className="ds-mediaframe__media" src={imageUrl!} alt={imageAlt || "Product preview"} loading="lazy" />
        )}
        <span className="ds-mediaframe__chip">
          <span className="ds-mediaframe__play" aria-hidden="true" />
          {label}
        </span>
      </div>
    </figure>
  );
}
