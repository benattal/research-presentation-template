/**
 * Borrowed figures arranged in rows under the title, for slides whose
 * figures differ in shape (a wide pipeline above a video, two wide method
 * figures stacked). `rows` is a list of `{ figures, weight? }`: `weight` is
 * the row's share of the height (default 1), `align: 'bottom'` sets the
 * row's figures on one bottom line (their captions in line) instead of
 * centering each in its cell, and each figure is a media
 * item with an optional `caption` (a short label), `width` (its share of
 * the row's width, default 1), and `step` (the build step it appears at,
 * default 0). Each figure is scaled to fit its cell without cropping, with
 * its caption directly under it, and the pair is centered in the cell.
 * A figure may also have `labels`: short lines of text or math set side by
 * side under it (and its caption), so they stay with the figure they
 * annotate. Borrowed figures are credited through the slide's `credits`.
 */
import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import './FigureRows.css';

const tracks = (shares) => shares.map((share) => `minmax(0, ${share}fr)`).join(' ');

export default function FigureRows({ slide, buildStep }) {
  if (!Array.isArray(slide.rows) || slide.rows.length === 0) {
    throw new Error(`Slide "${slide.id}": the figureRows layout needs a non-empty "rows" list`);
  }
  return (
    <div className="slide--figure-rows">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className="figure-rows-body" style={{ gridTemplateRows: tracks(slide.rows.map((row) => row.weight ?? 1)) }}>
        {slide.rows.map((row, r) => (
          <div
            key={r}
            className={`figure-rows-row${row.align === 'bottom' ? ' figure-rows-row--bottom' : ''}`}
            style={{ gridTemplateColumns: tracks(row.figures.map((figure) => figure.width ?? 1)) }}
          >
            {row.figures.map((figure) => (
              <motion.figure
                key={figure.src}
                className="figure-rows-item"
                initial={false}
                animate={{ opacity: buildStep >= (figure.step ?? 0) ? 1 : 0 }}
                transition={{ duration: 0.35 }}
              >
                <Media item={figure} className="figure-rows-media" />
                {figure.caption && <figcaption><Text>{figure.caption}</Text></figcaption>}
                {figure.labels && (
                  <div className="figure-rows-labels">
                    {figure.labels.map((label) => <span key={label} className="figure-rows-label"><Text>{label}</Text></span>)}
                  </div>
                )}
              </motion.figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
