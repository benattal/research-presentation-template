import { QRCodeSVG } from 'qrcode.react';
import './ColabLinkSlide.css';
import Text from '../../stage/Text.jsx';

/**
 * A notebook the audience opens on their own devices: `title`,
 * `description`, `colabUrl` (a button plus a QR code), optional `steps`
 * (`{ text, url? }`), `imageSrc` (shown instead of the QR code), and `note`.
 * Without `colabUrl` the button reads "Link Coming Soon" and no QR code is
 * drawn.
 */
export default function ColabLinkSlide({ slide }) {
  const url = slide.colabUrl;
  const hasUrl = Boolean(url);

  return (
    <div className="slide--colab">
      <h2><Text>{slide.title}</Text></h2>

      <p className="colab-description"><Text>{slide.description}</Text></p>

      {slide.steps && (
        <ol className="colab-steps">
          {slide.steps.map((step, i) => (
            <li key={i} className="colab-step">
              {step.url
                ? <a href={step.url} target="_blank" rel="noopener noreferrer">{step.text}</a>
                : step.text}
            </li>
          ))}
        </ol>
      )}

      <div className="colab-link-container">
        {slide.imageSrc && (
          <img className="colab-hero-image" src={slide.imageSrc} alt="" />
        )}

        {hasUrl ? (
          <a className="colab-button" href={url} target="_blank" rel="noopener noreferrer">
            Open in Google Colab
          </a>
        ) : (
          <span className="colab-button colab-button--disabled">
            Google Colab — Link Coming Soon
          </span>
        )}

        {hasUrl && !slide.imageSrc && (
          <div className="colab-qr">
            <QRCodeSVG value={url} size={180} />
          </div>
        )}

        {slide.note && <div className="colab-note">{slide.note}</div>}
      </div>
    </div>
  );
}
