import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import EquationStack from '../equations/EquationStack.jsx';
import './FigurePanel.css';

/**
 * One large figure on the left (a diagram, usually borrowed and credited
 * with the slide's `credits`) and, beside it, equations over a row of
 * smaller figures that appear by build step.
 *
 * Content fields: `title`, `subtitle`, `figure` (a media item with
 * `width`, its width in stage pixels), `equations` (lines `{ tex, step? }`
 * as in EquationStack: every line keeps its place from the first step),
 * `figures` (media items with a short `caption` and the `step` they appear
 * at), `rowHeight` (the height of the row's media, in stage pixels), and
 * `buildSteps`.
 */
export default function FigurePanel({ slide, buildStep }) {
  if (!slide.figure?.width) throw new Error('figurePanel: `figure` with a `width` is required');
  if (!Array.isArray(slide.figures) || !(slide.rowHeight > 0)) throw new Error('figurePanel: `figures` and `rowHeight` are required');
  return (
    <div className="slide--figure-panel">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="figure-panel-body">
        <figure className="figure-panel-main" style={{ width: slide.figure.width }}>
          <Media item={slide.figure} />
          {slide.figure.caption && <figcaption><Text>{slide.figure.caption}</Text></figcaption>}
        </figure>
        <div className="figure-panel-side">
          {slide.equations?.length > 0 && (
            <EquationStack lines={slide.equations} step={buildStep} dimEarlier={false} className="figure-panel-equations" />
          )}
          <div className="figure-panel-row">
            {slide.figures.map((item) => (
              <motion.figure
                key={item.src}
                className="figure-panel-item"
                initial={false}
                animate={{ opacity: buildStep >= (item.step ?? 0) ? 1 : 0 }}
                transition={{ duration: 0.35 }}
              >
                <div style={{ height: slide.rowHeight }}>
                  <Media item={item} />
                </div>
                {item.caption && <figcaption><Text>{item.caption}</Text></figcaption>}
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
