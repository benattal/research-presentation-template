/**
 * The lecture's general slide layouts: the title slide, section dividers,
 * figures (usually borrowed, credited through the slide's `credits`), and
 * step-by-step derivations. Each fills the space under its title; text is
 * a title, one short subtitle, and short labels.
 */
import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { renderMath } from '@core/stage/math.js';
import RoomStill from '../flatland/RoomStill.jsx';
import IterationPicture from '../linearAlgebra/IterationPicture.jsx';
import { TextWithBolt } from './Bolt.jsx';
import BounceSlices from './BounceSlices.jsx';
import './Slides.css';

/** Size of the title slide's room render, in stage pixels: the room's size on the slides that show it. */
const TITLE_RENDER = [800, 480];
/** Size of each title slide figure, in stage pixels (16 : 9): two rows of three fill the width under the title. */
const TITLE_FIGURE = [368, 207];
/** Size of a divider's picture, in stage pixels (5 : 3, as the room), the same on every divider. */
const DIVIDER_VISUAL = [480, 288];
/** Updates drawn in a divider's picture of x ← b + Ax, and the sizes of its marks at the divider's size. */
const DIVIDER_UPDATES = 12;
const DIVIDER_MARKS = { width: 2.5, head: 12, dot: 4, ring: 8 };

/**
 * The title slide (also the closing "Questions" slide): `title`, on one
 * line, and `subtitle` (the speaker line, optional), centered, with a
 * picture centered below them: either `figures`, media items each with a
 * short `caption`, in rows of three of TITLE_FIGURE size (each filled
 * and cropped to it, credited with the slide's `credits`), or a render of
 * the room (`render`, default 'light').
 */
export function LectureTitle({ slide }) {
  if (slide.figures && slide.figures.some((figure) => !figure.caption)) {
    throw new Error('lectureTitle: every figure needs a "caption"');
  }
  const [width, height] = TITLE_FIGURE;
  return (
    <div className="slide--lecture-title">
      <div className="lecture-title-text">
        <h1><Text>{slide.title}</Text></h1>
        {slide.subtitle && <p><Text>{slide.subtitle}</Text></p>}
      </div>
      {slide.figures ? (
        <div className="lecture-title-figures" style={{ gridTemplateColumns: `repeat(3, ${width}px)` }}>
          {slide.figures.map((figure) => (
            <figure key={figure.src} className="lecture-title-figure">
              <div className="lecture-title-media" style={{ width, height }}><Media item={figure} /></div>
              <figcaption><Text>{figure.caption}</Text></figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <RoomStill kind={slide.render ?? 'light'} width={TITLE_RENDER[0]} height={TITLE_RENDER[1]} className="lecture-title-render" />
      )}
    </div>
  );
}

/**
 * A section divider: `title` (the section's name; a "⚡" in it is drawn as
 * an SVG bolt), `subtitle` (one line on what the section does), and,
 * beside them on the right, one picture of DIVIDER_VISUAL size: a room
 * render (`render`: 'light', 'spot', 'pulse', or 'importance'), the
 * spotlight room in labelled slices by number of bounces (`slices`, see
 * BounceSlices), an image (`image`, a media item filling the box and
 * cropped to it, credited with the slide's `credits`), or the Neumann
 * series section's updates x ← b + Ax on its example (`iterates`:
 * `eigenvectors`, `lambda`, `b`).
 */
export function SectionTitle({ slide }) {
  const [width, height] = DIVIDER_VISUAL;
  return (
    <div className="slide--section-title">
      <div className="section-title-text">
        <h1><TextWithBolt>{slide.title}</TextWithBolt></h1>
        {slide.subtitle && <p><Text>{slide.subtitle}</Text></p>}
      </div>
      <div className="section-title-visual" style={{ width, height }}>
        {slide.render && <RoomStill kind={slide.render} width={width} height={height} className="section-title-render" />}
        {slide.slices && <BounceSlices slices={slide.slices} width={width} height={height} />}
        {slide.image && <img className="section-title-render section-title-image" src={slide.image.src} alt={slide.image.alt ?? ''} />}
        {slide.iterates && (
          <IterationPicture
            example={slide.iterates}
            width={width}
            height={height}
            updates={DIVIDER_UPDATES}
            marks={DIVIDER_MARKS}
            pad={28}
            className="section-title-plane"
          />
        )}
      </div>
    </div>
  );
}

/**
 * One to four figures filling the slide under the title: `figures` is a
 * list of media items with optional `caption` (a short label) and `step`
 * (the build step it appears at, default 0). Borrowed figures are credited
 * with the slide's `credits`. An optional `fit` `{ aspect, position }`
 * shows the media in a box of that aspect ratio (width / height), filled
 * and cropped at `position` (a CSS object-position): it cuts a video's
 * black borders without re-encoding it. A figure with `until` fades out
 * at that build step.
 *
 * By default the figures sit in one row (four in a 2 × 2 grid). An
 * optional `columns` (and `rows`, default enough for every figure) lays
 * them out in a grid of equal cells, row by row; a figure may set its
 * `column` and `row` (from 1) and the columns it covers, `span` (default
 * 1). Two figures in the same cells overlap: one can replace the other
 * in place, with `until` on the first and `step` on the second.
 *
 * With `uniform: true`, every figure's media fills its cell above the
 * caption (scaled to fit, centered), so the captions of a row share one
 * line whatever the media's shapes. An optional `cellWidth` (stage pixels)
 * gives the columns that width and centers the grid, for media narrower
 * than an equal share of the slide (4:3 photos in a 2 × 2 grid).
 */
export function Figures({ slide, buildStep }) {
  const figures = slide.figures ?? [];
  const cells = figures.reduce((sum, figure) => sum + (figure.span ?? 1), 0);
  const columns = slide.columns ?? (figures.length === 4 ? 2 : figures.length);
  const grid = {
    ...(slide.columns && {
      gridTemplateColumns: `repeat(${slide.columns}, 1fr)`,
      gridTemplateRows: `repeat(${slide.rows ?? Math.ceil(cells / slide.columns)}, 1fr)`,
    }),
    ...(slide.cellWidth && { gridTemplateColumns: `repeat(${columns}, ${slide.cellWidth}px)`, justifyContent: 'center', columnGap: 32 }),
  };
  const gridClass = `figures-grid figures-grid--${Math.min(figures.length, 4)}${slide.uniform ? ' figures-grid--uniform' : ''}`;
  const place = (figure) => {
    if (!figure.span && !figure.column && !figure.row) return undefined;
    const style = { gridColumn: `${figure.column ?? 'auto'} / span ${figure.span ?? 1}` };
    if (figure.row) style.gridRow = figure.row;
    return style;
  };
  const shown = (figure) => buildStep >= (figure.step ?? 0) && !(buildStep >= figure.until);
  return (
    <div className="slide--figures">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className={gridClass} style={grid}>
        {figures.map((figure) => (
          <motion.figure
            key={figure.src}
            className="figures-item"
            style={place(figure)}
            initial={false}
            animate={{ opacity: shown(figure) ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="figures-media">
              {figure.fit ? (
                <div
                  className="figures-fit"
                  style={{ aspectRatio: figure.fit.aspect, '--figures-fit-position': figure.fit.position ?? 'center' }}
                >
                  <Media item={figure} />
                </div>
              ) : <Media item={figure} />}
            </div>
            {figure.caption && <figcaption><Text>{figure.caption}</Text></figcaption>}
          </motion.figure>
        ))}
      </div>
    </div>
  );
}

/**
 * A derivation: `lines`, each `{ tex, label? }`, appear one per build step;
 * the newest line is in full color and earlier ones are muted. A line's
 * label sits above it, as in the deck's equation stacks, so labels share
 * the lines' left edge. Every line takes its place from the first step.
 *
 * An optional `figure` (a media item with `caption`, and an optional
 * `width` in stage pixels; 46% of the slide without it) sits on the right,
 * and the lines are spread over its height: the first level with its top,
 * the last with its caption. A figure made of equal columns can label each
 * one under it: `columnLabels` (short labels, left to right) and
 * `columnInset` (the fraction of the figure's width left of the first
 * column, such as the original's row labels); `labels` are short lines
 * under the caption, side by side. An optional `fontSize` (a CSS length)
 * sets the size of the lines.
 *
 * Two options pace the figure with the lines: `figure.step`, the build
 * step it appears at (its space is kept from the first step), and
 * `figure.rowSteps`, for a figure made of equal rows: one list of build
 * steps per row, top to bottom, at which that row is the one the lines
 * are about; at those steps the other rows are veiled.
 */
export function Derivation({ slide, buildStep }) {
  const lines = slide.lines ?? [];
  const figure = slide.figure;
  const markedRow = figure?.rowSteps?.findIndex((steps) => steps.includes(buildStep)) ?? -1;
  return (
    <div className="slide--derivation">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className={`derivation-body${slide.figure ? ' derivation-body--figure' : ''}`}>
        <ol className="derivation-lines" style={slide.fontSize ? { fontSize: slide.fontSize } : undefined}>
          {lines.map((line, i) => (
            <motion.li
              key={line.tex}
              className={i === Math.min(buildStep, lines.length - 1) ? 'derivation-line--current' : ''}
              initial={false}
              animate={{ opacity: i <= buildStep ? 1 : 0 }}
              transition={{ duration: 0.35 }}
            >
              {line.label && <span className="derivation-label"><Text>{line.label}</Text></span>}
              <span className="derivation-math" dangerouslySetInnerHTML={{ __html: renderMath(line.tex, true) }} />
            </motion.li>
          ))}
        </ol>
        {slide.figure && (
          <motion.figure
            className="derivation-figure"
            style={slide.figure.width ? { flexBasis: slide.figure.width } : undefined}
            initial={false}
            animate={{ opacity: buildStep >= (figure.step ?? 0) ? 1 : 0 }}
            transition={{ duration: 0.35 }}
          >
            {figure.rowSteps ? (
              <div className="derivation-figure-rows">
                <Media item={figure} />
                {figure.rowSteps.map((steps, row) => (
                  <motion.div
                    key={row}
                    className="derivation-figure-veil"
                    style={{ top: `${(100 * row) / figure.rowSteps.length}%`, height: `${100 / figure.rowSteps.length}%` }}
                    initial={false}
                    animate={{ opacity: markedRow >= 0 && markedRow !== row ? 0.72 : 0 }}
                    transition={{ duration: 0.35 }}
                  />
                ))}
              </div>
            ) : <Media item={figure} />}
            {slide.figure.columnLabels && (
              <div
                className="derivation-figure-columns"
                style={{
                  gridTemplateColumns: `repeat(${slide.figure.columnLabels.length}, 1fr)`,
                  paddingLeft: `${100 * (slide.figure.columnInset ?? 0)}%`,
                }}
              >
                {slide.figure.columnLabels.map((label) => <span key={label}><Text>{label}</Text></span>)}
              </div>
            )}
            {slide.figure.caption && <figcaption><Text>{slide.figure.caption}</Text></figcaption>}
            {slide.figure.labels && (
              <div className="derivation-figure-labels">
                {slide.figure.labels.map((label) => <span key={label}><Text>{label}</Text></span>)}
              </div>
            )}
          </motion.figure>
        )}
      </div>
    </div>
  );
}
