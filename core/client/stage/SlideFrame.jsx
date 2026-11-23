import { motion } from 'framer-motion';
import { getTransition } from './transitions.js';
import Text from './Text.jsx';

/**
 * One slide: the transition wrapper, the optional section label and
 * footnote, and the slide's layout component.
 *
 * Layouts receive `{ slide, buildStep, sections, slides, citations }`.
 * `slide` is the slide's `content.json` plus its position fields (see
 * `buildPresentation`); `buildStep` is the 0-based step within the slide;
 * `sections` is the presentation's section list, for layouts such as the
 * outline; `slides` is every listed slide, for a layout that looks at the
 * deck (the task layout); `citations` is every source the presentation
 * cites, for the credits layout. A slide with `credits` shows its credit line at the bottom.
 *
 * Render it as the keyed child of `AnimatePresence` so a slide change plays
 * the exit and enter transitions. A build-step change re-renders the same
 * layout instance; layouts react to `buildStep` themselves.
 */
export default function SlideFrame({ presentation, slide, buildStep, direction, transition }) {
  const Layout = presentation.layouts[slide.layout];
  const variant = getTransition(transition ?? slide.transition ?? presentation.defaultTransition, direction);

  return (
    <motion.div
      className="slide"
      data-slide-id={slide.id}
      data-section={slide.sectionId}
      initial={variant.initial}
      animate={variant.animate}
      exit={variant.exit}
      transition={variant.transition}
    >
      <div className="slide-content">
        {slide.sectionLabel && <div className="section-label">{slide.sectionLabel}</div>}
        <Layout
          slide={slide}
          buildStep={buildStep}
          sections={presentation.sections}
          slides={presentation.slides}
          citations={presentation.citations}
        />
      </div>
      {slide.footnote && <div className="slide-footnote"><Text>{slide.footnote}</Text></div>}
      {slide.creditLine && <div className="slide-credits"><Text>{slide.creditLine}</Text></div>}
    </motion.div>
  );
}
