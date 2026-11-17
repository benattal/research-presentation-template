import { motion, AnimatePresence } from 'framer-motion';
import Media from '../../stage/Media.jsx';
import './ProgressiveBuildSlide.css';
import Text from '../../stage/Text.jsx';

/**
 * Click-to-reveal steps: `buildSteps` is a list of `{ label, description?,
 * media? }`, and step k shows the first k + 1 of them. An optional
 * `className` is added to the root for per-slide styling.
 */
export default function ProgressiveBuildSlide({ slide, buildStep }) {
  const steps = slide.buildSteps || [];
  const visibleCount = buildStep + 1;

  const extraClass = slide.className || '';

  return (
    <div className={`slide--progressive ${extraClass}`}>
      <h2><Text>{slide.title}</Text></h2>

      <div className="build-steps">
        <AnimatePresence>
          {steps.map((step, i) => {
            if (i >= visibleCount) return null;
            return (
              <motion.div
                key={i}
                className="build-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="build-step-header">
                  <span className="build-step-label"><Text>{step.label}</Text></span>
                  {step.description && (
                    <span className="build-step-description"><Text>{step.description}</Text></span>
                  )}
                </div>
                {step.media && step.media.length > 0 && (
                  <div className="build-step-media">
                    {step.media.map((item) => <Media key={item.src} item={item} />)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
