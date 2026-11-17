import { motion } from 'framer-motion';
import Media from '../../stage/Media.jsx';
import './MediaSlide.css';

/** A title over a grid of up to four `media` items. */
export default function MediaSlide({ slide }) {
  return (
    <div className="slide--media">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {slide.title}
      </motion.h2>

      <div className="media-grid">
        {slide.media.map((m, i) => (
          <motion.div
            key={i}
            className="media-grid-item"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 * i, duration: 0.4 }}
          >
            <Media item={m} controls />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
