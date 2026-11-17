import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNumericPoll } from '../../live/polls.js';
import LiveStatus from '../../live/LiveStatus.jsx';
import './NumericPollSlide.css';

/**
 * Each audience member submits one number (`pollId`, `title`, optional
 * `subtitle`); the answers appear as a histogram. Submitting again replaces
 * the browser's earlier answer.
 */
export default function NumericPollSlide({ slide }) {
  const { values, myValue, connected, votingOpen, submit } = useNumericPoll(slide.pollId);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);
  const submitted = myValue !== null && !editing;

  async function handleSubmit(event) {
    event.preventDefault();
    const value = Number(input);
    if (input === '' || !Number.isFinite(value)) return;
    if (await submit(value)) setEditing(false);
  }

  const freqMap = useMemo(() => {
    const map = {};
    for (const v of values) map[v] = (map[v] || 0) + 1;
    return map;
  }, [values]);

  const sortedKeys = useMemo(() =>
    Object.keys(freqMap).map(Number).sort((a, b) => a - b),
    [freqMap]
  );

  const maxCount = sortedKeys.length > 0 ? Math.max(...Object.values(freqMap)) : 1;

  return (
    <div className="slide--numeric-poll">
      <motion.h2
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {slide.title}
      </motion.h2>

      {slide.subtitle && (
        <motion.p
          className="np-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {slide.subtitle}
        </motion.p>
      )}

      <div className="np-body">
        {/* Input form */}
        <motion.form
          className="np-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div className="np-input-row">
            <input
              className={`np-input${submitted ? ' np-input--done' : ''}`}
              type="number"
              min="0"
              max="9999"
              placeholder="?"
              value={submitted ? String(myValue) : input}
              onChange={(event) => { setInput(event.target.value); setEditing(true); }}
              disabled={!votingOpen}
            />
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="check"
                  className="np-submitted-badge"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  ✓ Submitted!
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  className="np-submit"
                  type="submit"
                  disabled={!votingOpen || input === ''}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Submit
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.form>

        {/* Results bar chart */}
        <AnimatePresence>
          {values.length > 0 && (
            <motion.div
              className="np-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="np-chart">
                {sortedKeys.map(key => (
                  <div key={key} className="np-bar-col">
                    <div className="np-count-label">{freqMap[key]}</div>
                    <motion.div
                      className="np-bar"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      style={{ '--bar-frac': freqMap[key] / maxCount }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                    <div className="np-bar-label">{key}</div>
                  </div>
                ))}
              </div>
              <div className="np-total">{values.length} response{values.length !== 1 ? 's' : ''}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LiveStatus connected={connected} votingOpen={votingOpen} className="np-status" />
    </div>
  );
}
