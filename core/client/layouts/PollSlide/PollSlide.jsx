import { motion } from 'framer-motion';
import { useChoicePoll } from '../../live/polls.js';
import LiveStatus from '../../live/LiveStatus.jsx';
import './PollSlide.css';

/**
 * A multiple-choice question the audience votes on from their own devices
 * (`pollId`, `title`, `question`, `options`). Pair it with a `pollResults`
 * slide that has the same `pollId` and `options`. Clicking another option
 * changes this browser's vote.
 */
export default function PollSlide({ slide }) {
  const { pollId, question, options } = slide;
  const { myVote, connected, votingOpen, vote } = useChoicePoll(pollId, options);

  return (
    <div className="slide--poll">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {slide.title}
      </motion.h2>

      <motion.p
        className="poll-question"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {question}
      </motion.p>

      <div className="poll-options">
        {options.map((option, i) => (
          <motion.button
            key={option}
            className={`poll-option${myVote === i ? ' poll-option--selected' : ''}`}
            onClick={() => vote(i)}
            disabled={!votingOpen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            whileHover={votingOpen ? { scale: 1.03 } : undefined}
            whileTap={votingOpen ? { scale: 0.97 } : undefined}
          >
            <span className="poll-option-letter">{String.fromCharCode(65 + i)}</span>
            <span className="poll-option-text">{option}</span>
          </motion.button>
        ))}
      </div>

      <LiveStatus connected={connected} votingOpen={votingOpen} />
    </div>
  );
}
