import { motion } from 'framer-motion';
import './TitleSlide.css';
import Text from '../../stage/Text.jsx';

export default function TitleSlide({ slide, renderBackground }) {
  return (
    <div className="slide--title">
      {renderBackground ? renderBackground(slide) : (
        slide.background ? (
          <div
            className="title-bg"
            style={{ backgroundImage: `url(${slide.background})` }}
          />
        ) : null
      )}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Text>{slide.title}</Text>
      </motion.h1>
      {slide.subtitle && (
        <motion.p
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Text>{slide.subtitle}</Text>
        </motion.p>
      )}
    </div>
  );
}
