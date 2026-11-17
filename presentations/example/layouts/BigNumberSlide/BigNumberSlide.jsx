import { motion } from 'framer-motion';
import './BigNumberSlide.css';

/**
 * One large number with a caption; the second build step reveals an
 * explanation. Content: `value`, `caption`, `explanation`, and
 * `buildSteps: [{}, {}]` (two steps; the entries carry no data).
 *
 * This layout is the template's example of a presentation-specific layout:
 * it lives in the presentation, is registered in `layouts/index.js`, reads
 * its fields from `slide`, and reacts to `buildStep`.
 */
export default function BigNumberSlide({ slide, buildStep }) {
  return (
    <div className="slide--big-number">
      <motion.div
        className="big-number-value"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {slide.value}
      </motion.div>
      <div className="big-number-caption">{slide.caption}</div>
      <motion.p
        className="big-number-explanation"
        initial={false}
        animate={{ opacity: buildStep >= 1 ? 1 : 0, y: buildStep >= 1 ? 0 : 12 }}
        transition={{ duration: 0.4 }}
      >
        {slide.explanation}
      </motion.p>
    </div>
  );
}
