import { motion } from 'framer-motion';
import { useChoicePoll } from '@core/live/polls.js';
import './KernelPollSlide.css';

function KernelGrid({ kernel, divisor }) {
  return (
    <div className="kernel-vis">
      <div
        className="kernel-vis-grid"
        style={{ gridTemplateColumns: `repeat(${kernel[0].length}, 1fr)` }}
      >
        {kernel.flat().map((val, i) => (
          <span key={i} className={`kernel-vis-cell ${val === 0 ? 'kernel-vis-cell--zero' : ''}`}>
            {val}
          </span>
        ))}
      </div>
      {divisor && <span className="kernel-vis-divisor">÷ {divisor}</span>}
    </div>
  );
}

export default function KernelPollSlide({ slide }) {
  const { pollId, title, question, kernelOptions } = slide;
  const optionLabels = kernelOptions.map((_, i) => String.fromCharCode(65 + i));
  const { myVote, vote } = useChoicePoll(pollId, optionLabels);

  return (
    <div className="slide--kernel-poll">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {title}
      </motion.h2>

      {question && (
        <motion.p
          className="kernel-poll-question"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {question}
        </motion.p>
      )}

      <div className="kernel-poll-options">
        {kernelOptions.map((opt, i) => (
          <motion.button
            key={i}
            className={`kernel-poll-option ${myVote === i ? 'kernel-poll-option--selected' : ''}`}
            onClick={() => vote(i)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="kernel-poll-letter">{String.fromCharCode(65 + i)}</span>
            <KernelGrid kernel={opt.kernel} divisor={opt.divisor} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
