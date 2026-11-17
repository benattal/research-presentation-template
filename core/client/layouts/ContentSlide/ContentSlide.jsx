import { motion } from 'framer-motion';
import Media from '../../stage/Media.jsx';
import './ContentSlide.css';

/** A title, a bullet list (`bullets`), and an optional row of `media`. */
export default function ContentSlide({ slide }) {
  return (
    <div className="slide--content">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {slide.title}
      </motion.h2>

      {slide.bullets && (
        <ul className="bullet-list">
          {slide.bullets.map((bullet, i) => (
            <motion.li
              key={i}
              className="bullet-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
            >
              <span className="bullet-icon">&#9656;</span>
              {bullet}
            </motion.li>
          ))}
        </ul>
      )}

      {slide.media && slide.media.length > 0 && (
        <motion.div
          className="slide-media-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {slide.media.map((item) => <Media key={item.src} item={item} />)}
        </motion.div>
      )}
    </div>
  );
}
