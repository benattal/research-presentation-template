import { motion } from 'framer-motion';
import { useChoicePoll } from '../../live/polls.js';
import LiveStatus from '../../live/LiveStatus.jsx';
import './PollSlide.css';
import Text from '../../stage/Text.jsx';

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
      <h2><Text>{slide.title}</Text></h2>

      <p className="poll-question">{question}</p>

      <div className="poll-options">
        {options.map((option, i) => (
          <motion.button
            key={option}
            className={`poll-option${myVote === i ? ' poll-option--selected' : ''}`}
            onClick={() => vote(i)}
            disabled={!votingOpen}
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
