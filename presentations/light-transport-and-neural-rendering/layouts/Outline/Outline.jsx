import { motion } from 'framer-motion';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import RoomStill from '../flatland/RoomStill.jsx';
import { TextWithBolt } from '../Slides/Bolt.jsx';
import './Outline.css';

const THUMB = [128, 76];

/** A small plot of the partial sums of 1 + a + a² + … approaching 1/(1 − a). */
function SeriesThumbnail() {
  const [w, h] = THUMB;
  const a = 0.8;
  const limit = 1 / (1 - a);
  const points = [];
  let sum = 0;
  for (let k = 0; k < 14; k += 1) {
    sum += a ** k;
    points.push([12 + (k * (w - 24)) / 13, h - 10 - ((h - 24) * sum) / limit]);
  }
  return (
    <svg className="sections-outline-thumb sections-outline-thumb--plot" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line x1="8" x2={w - 8} y1={14} y2={14} className="sections-outline-plot-limit" />
      <line x1="8" x2={w - 8} y1={h - 10} y2={h - 10} className="sections-outline-plot-axis" />
      {points.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="3.2" className="sections-outline-plot-dot" />)}
    </svg>
  );
}

function Thumbnail({ visual }) {
  if (visual.render) return <RoomStill kind={visual.render} width={THUMB[0]} height={THUMB[1]} className="sections-outline-thumb" />;
  if (visual.image) return <img className="sections-outline-thumb sections-outline-thumb--image" src={visual.image} alt="" />;
  return <SeriesThumbnail />;
}

/**
 * The lecture's outline: one row per section with its name, a plain
 * one-line description, and a small picture of the section (a room render,
 * an image, or the series plot). `sections` is a list of
 * `{ title, subtitle, render? | image?, aside? }`; an aside row is indented
 * under the section before it. Rows appear one per build step.
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
