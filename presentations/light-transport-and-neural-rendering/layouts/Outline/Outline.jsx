import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import RoomStill from '../flatland/RoomStill.jsx';
import IterationPicture from '../linearAlgebra/IterationPicture.jsx';
import { TextWithBolt } from '../Slides/Bolt.jsx';
import './Outline.css';

const THUMB = [128, 76];
/** Updates drawn in the Neumann series picture, and the sizes of its marks at the thumbnail's size. */
const THUMB_UPDATES = 12;
const THUMB_MARKS = { width: 1.6, head: 6, dot: 2.2, ring: 4.5 };

/** A section's picture, from its data: a room render, an image, or the Neumann series iterates. */
function Thumbnail({ visual }) {
  if (visual.render) return <RoomStill kind={visual.render} width={THUMB[0]} height={THUMB[1]} className="sections-outline-thumb" />;
  if (visual.image) return <img className="sections-outline-thumb sections-outline-thumb--image" src={visual.image} alt="" />;
  if (visual.iterates) {
    return (
      <IterationPicture
        example={visual.iterates}
        width={THUMB[0]}
        height={THUMB[1]}
        updates={THUMB_UPDATES}
        marks={THUMB_MARKS}
        pad={8}
        className="sections-outline-thumb sections-outline-thumb--plane"
      />
    );
  }
  throw new Error(`sectionOutline: section "${visual.title}" needs "render", "image", or "iterates"`);
}

/**
 * The lecture's outline: one row per section with its name, a plain
 * one-line description, and a small picture of the section (a room render,
 * an image, or the Neumann series iterates). `sections` is a list of
 * `{ title, subtitle, render | image | iterates, aside? }`; an aside row is
 * indented under the section before it. Rows appear one per build step.
 */
export default function Outline({ slide, buildStep }) {
  return (
    <div className="slide--sections-outline-list">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <ol className="sections-outline-list">
        {slide.sections.map((section, i) => (
          <motion.li
            key={section.title}
            className={section.aside ? 'sections-outline-row sections-outline-row--aside' : 'sections-outline-row'}
            initial={false}
            animate={{ opacity: i <= buildStep ? 1 : 0.18 }}
            transition={{ duration: 0.35 }}
          >
            <span className="sections-outline-text">
              <span className="sections-outline-title"><TextWithBolt>{section.title}</TextWithBolt></span>
              <span className="sections-outline-subtitle"><Text>{section.subtitle}</Text></span>
            </span>
            <Thumbnail visual={section} />
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
