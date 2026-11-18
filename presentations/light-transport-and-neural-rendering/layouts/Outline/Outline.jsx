import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import RoomStill from '../flatland/RoomStill.jsx';
import { fixedPointIterates, solve } from '../linearAlgebra/linear.js';
import { normalize, spectralMatrix } from '../linearAlgebra/plane.js';
import VectorPlane, { Arrow, FixedPointUpdates, Ring, fitView } from '../linearAlgebra/VectorPlane.jsx';
import { TextWithBolt } from '../Slides/Bolt.jsx';
import './Outline.css';

const THUMB = [128, 76];
/** Updates drawn in the Neumann series picture. */
const THUMB_UPDATES = 12;

/**
 * The Neumann series section's picture: the updates x_{k+1} = b + A x_k
 * from x_0 = 0 stepping to the solution (the ring), drawn as on the
 * section's slides, small. `iterates` gives A (`eigenvectors`, `lambda`)
 * and `b`, the data of those slides.
 */
function IterationThumbnail({ iterates }) {
  const A = spectralMatrix(iterates.eigenvectors.map(normalize), iterates.lambda);
  const { b } = iterates;
  const solution = solve(A, b);
  const view = fitView([[0, 0], b, solution], ...THUMB, 8);
  return (
    <VectorPlane view={view} className="sections-outline-thumb sections-outline-thumb--plane">
      <FixedPointUpdates view={view} b={b} iterates={fixedPointIterates(A, b, [0, 0], THUMB_UPDATES)} shown={THUMB_UPDATES} width={1.6} head={6} dot={2.2} />
      <Arrow view={view} from={[0, 0]} to={b} className="la-ink-emission" width={1.8} head={6} />
      <Ring view={view} at={solution} r={4.5} />
    </VectorPlane>
  );
}

/** A section's picture, from its data: a room render, an image, or the Neumann series iterates. */
function Thumbnail({ visual }) {
  if (visual.render) return <RoomStill kind={visual.render} width={THUMB[0]} height={THUMB[1]} className="sections-outline-thumb" />;
  if (visual.image) return <img className="sections-outline-thumb sections-outline-thumb--image" src={visual.image} alt="" />;
  if (visual.iterates) return <IterationThumbnail iterates={visual.iterates} />;
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
