import { motion } from 'framer-motion';
import { useChoicePoll } from '@core/live/polls.js';
import './ImagePollSlide.css';

export default function ImagePollSlide({ slide }) {
  const { pollId, title, imageA, imageB, options } = slide;
  const { myVote, vote } = useChoicePoll(pollId, options);

  const images = [imageA, imageB];

  return (
    <div className="slide--image-poll">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {title}
      </motion.h2>

      <div className="image-poll-images">
        {images.map((img, i) => (
          <motion.div
            key={i}
            className={`image-poll-card ${myVote === i ? 'image-poll-card--selected' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
          >
            <img src={img.src} alt={img.label} />
            <motion.button
              className={`image-poll-vote-btn ${myVote === i ? 'image-poll-vote-btn--selected' : ''}`}
              onClick={() => vote(i)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="poll-option-letter">{String.fromCharCode(65 + i)}</span>
              {img.label}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
