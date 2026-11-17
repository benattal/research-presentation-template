import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import RoomStill from '../flatland/RoomStill.jsx';
import './PointList.css';
import { TextWithBolt } from '../Slides/Bolt.jsx';

/** Size of the optional room render beside the list, in stage pixels. */
const RENDER_SIZE = [440, 264];

/**
 * Short lines under the title, one statement each, large enough to read
 * from the back: the outline (each section's name and its form of
 * x = e + Ax) and the summary. `points` is a list of `{ label?, text }`:
 * `label` sits in a first column (a section's name), `text` may hold math.
 * With `buildSteps`, point i appears at step i; without, all show at once.
 * An optional `render` (a RoomStill kind) draws the lit room beside them.
 */
export default function PointList({ slide, buildStep }) {
  const points = slide.points;
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error(`Slide "${slide.id}": the pointList layout needs a non-empty "points" list`);
  }
  const stepped = Array.isArray(slide.buildSteps);
  const labelled = points.some((point) => point.label);
  return (
    <div className="slide--point-list">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="point-list-body">
        <ol className={`point-list${labelled ? ' point-list--labelled' : ''}`}>
          {points.map((point, i) => (
            <motion.li
              key={point.text}
              initial={false}
              animate={{ opacity: !stepped || i <= buildStep ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {labelled && <span className="point-list-label"><TextWithBolt>{point.label ?? ''}</TextWithBolt></span>}
              <span className="point-list-text"><Text>{point.text}</Text></span>
            </motion.li>
          ))}
        </ol>
        {slide.render && (
          <RoomStill kind={slide.render} width={RENDER_SIZE[0]} height={RENDER_SIZE[1]} className="point-list-render" />
        )}
      </div>
    </div>
  );
}
