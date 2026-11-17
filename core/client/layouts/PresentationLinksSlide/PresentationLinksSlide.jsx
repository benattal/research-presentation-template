import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import './PresentationLinksSlide.css';
import Text from '../../stage/Text.jsx';

/**
 * A menu of other presentations: the landing slide of a site that serves
 * several presentations behind the live gateway.
 *
 * Content: `title`, optional `subtitle`, optional `qrCode` (`{ url, label? }`)
 * so the audience can open the site on their phones, and `links`, a list of
 * `{ href, title, description?, icon? }`. An `href` is relative to this
 * presentation's URL, so `"../filtering/"` reaches a sibling presentation.
 */
export default function PresentationLinksSlide({ slide }) {
  return (
    <div className="slide--links">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Text>{slide.title}</Text>
      </motion.h1>
      {slide.subtitle && <p className="links-subtitle"><Text>{slide.subtitle}</Text></p>}

      {slide.qrCode && (
        <div className="links-qr">
          <div className="links-qr-code">
            <QRCodeSVG value={slide.qrCode.url} size={132} />
          </div>
          <a href={slide.qrCode.url} target="_blank" rel="noopener noreferrer">
            {slide.qrCode.label ?? slide.qrCode.url}
          </a>
        </div>
      )}

      <div className="links-cards">
        {slide.links.map((link, i) => (
          <motion.a
            key={link.href}
            className="links-card"
            href={link.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
          >
            {link.icon && <div className="links-card-icon">{link.icon}</div>}
            <h2>{link.title}</h2>
            {link.description && <p>{link.description}</p>}
          </motion.a>
        ))}
      </div>
    </div>
  );
}
