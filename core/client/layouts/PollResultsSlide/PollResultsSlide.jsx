import { motion } from 'framer-motion';
import { useChoicePoll } from '../../live/polls.js';
import LiveStatus from '../../live/LiveStatus.jsx';
import './PollResultsSlide.css';
import Text from '../../stage/Text.jsx';

const BAR_COLORS = [
  'var(--accent)',
  'var(--accent-secondary)',
  'var(--warning)',
  'var(--success)',
  '#e84393',
  '#fd79a8',
];

/**
 * Live bar chart of a poll's votes (`pollId`, `options`, `title`, optional
 * `question`), updated as votes arrive. Bar lengths are relative to the
 * leading option; percentages are of all votes.
 */
export default function PollResultsSlide({ slide }) {
  const { pollId, options } = slide;
  const { counts, totalVotes, connected, votingOpen } = useChoicePoll(pollId, options);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="slide--poll-results">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <Text>{slide.title}</Text>
      </motion.h2>

      {slide.question && (
        <motion.p
          className="poll-results-question"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Text>{slide.question}</Text>
        </motion.p>
      )}

      <div className="poll-results-chart">
        {options.map((option, i) => {
          const count = counts[i] ?? 0;
          const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          return (
            <motion.div
              key={option}
              className="poll-result-row"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
            >
              <div className="poll-result-label">{option}</div>
              <div className="poll-result-bar-container">
                <motion.div
                  className="poll-result-bar"
                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 60, damping: 15 }}
                />
                <span className="poll-result-pct">{percent.toFixed(0)}%</span>
              </div>
              <span className="poll-result-count">{count}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="poll-results-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <span className="poll-total">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
        <LiveStatus connected={connected} votingOpen={votingOpen} />
      </motion.div>
    </div>
  );
}
