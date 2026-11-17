import { motion } from 'framer-motion';
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
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Text>{slide.title}</Text>
      </motion.h2>

      <motion.p
        className="colab-description"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Text>{slide.description}</Text>
      </motion.p>

      {slide.steps && (
        <motion.ol
          className="colab-steps"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {slide.steps.map((step, i) => (
            <li key={i} className="colab-step">
              {step.url
                ? <a href={step.url} target="_blank" rel="noopener noreferrer">{step.text}</a>
                : step.text}
            </li>
          ))}
        </motion.ol>
      )}

      <motion.div
        className="colab-link-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
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
      </motion.div>
    </div>
  );
}
