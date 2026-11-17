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
 * leading option; percentages are of all votes. A bar shows its count when
 * the slide appears and grows or shrinks as votes change.
 */
export default function PollResultsSlide({ slide }) {
  const { pollId, options } = slide;
  const { counts, totalVotes, connected, votingOpen } = useChoicePoll(pollId, options);
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="slide--poll-results">
      <h2><Text>{slide.title}</Text></h2>

      {slide.question && (
        <p className="poll-results-question"><Text>{slide.question}</Text></p>
      )}

      <div className="poll-results-chart">
        {options.map((option, i) => {
          const count = counts[i] ?? 0;
          const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          return (
            <div key={option} className="poll-result-row">
              <div className="poll-result-label">{option}</div>
              <div className="poll-result-bar-container">
                <motion.div
                  className="poll-result-bar"
                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                  initial={false}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                />
                <span className="poll-result-pct">{percent.toFixed(0)}%</span>
              </div>
              <span className="poll-result-count">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="poll-results-footer">
        <span className="poll-total">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</span>
        <LiveStatus connected={connected} votingOpen={votingOpen} />
      </div>
    </div>
  );
}
