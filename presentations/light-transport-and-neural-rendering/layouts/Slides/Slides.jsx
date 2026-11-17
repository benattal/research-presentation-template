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
import { TextWithBolt } from './Bolt.jsx';
import SeriesPlot from './SeriesPlot.jsx';
import './Slides.css';

/**
 * The title slide: `title`, `subtitle` (the speaker line), and a render of
 * the room (`render`, default 'light') below them on the right. The title
 * spans the slide, so it stays on one line.
 */
export function LectureTitle({ slide }) {
  return (
    <div className="slide--lecture-title">
      <div className="lecture-title-text">
        <h1><Text>{slide.title}</Text></h1>
        {slide.subtitle && <p><Text>{slide.subtitle}</Text></p>}
      </div>
      <RoomStill kind={slide.render ?? 'light'} width={640} height={384} className="lecture-title-render" />
    </div>
  );
}

/**
 * A section divider: `number`, `title` (the section's name; a "⚡" in it is
 * drawn as an SVG bolt), `subtitle` (one line on what the section does),
 * and optionally, below them on the right, a room render (`render`:
 * 'light', 'spot', 'pulse', or 'importance') or an image (`image`, a media
 * item, credited with the slide's `credits`).
 */
export function SectionTitle({ slide }) {
  return (
    <div className="slide--section-title">
      <div className="section-title-text">
        {slide.number && <div className="section-title-number">{slide.number}</div>}
        <h1><TextWithBolt>{slide.title}</TextWithBolt></h1>
        {slide.subtitle && <p><Text>{slide.subtitle}</Text></p>}
      </div>
      <div className="section-title-visual">
        {slide.render && <RoomStill kind={slide.render} width={520} height={312} className="section-title-render" />}
        {slide.image && <img className="section-title-render section-title-image" src={slide.image.src} alt={slide.image.alt ?? ''} />}
        {slide.series && <SeriesPlot width={520} height={312} />}
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
 * black borders without re-encoding it.
 */
export function Figures({ slide, buildStep }) {
  const figures = slide.figures ?? [];
  return (
    <div className="slide--figures">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className={`figures-grid figures-grid--${Math.min(figures.length, 4)}`}>
        {figures.map((figure) => (
          <motion.figure
            key={figure.src}
            className="figures-item"
            initial={false}
            animate={{ opacity: buildStep >= (figure.step ?? 0) ? 1 : 0 }}
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
 * the newest line is in full color and earlier ones are muted. An optional
 * `figure` (a media item with `caption`, and an optional `width` in stage
 * pixels; 46% of the slide without it) sits on the right.
 */
export function Derivation({ slide, buildStep }) {
  const lines = slide.lines ?? [];
  return (
    <div className="slide--derivation">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <div className={`derivation-body${slide.figure ? ' derivation-body--figure' : ''}`}>
        <ol className="derivation-lines">
          {lines.map((line, i) => (
            <motion.li
              key={line.tex}
              className={i === Math.min(buildStep, lines.length - 1) ? 'derivation-line--current' : ''}
              initial={false}
              animate={{ opacity: i <= buildStep ? 1 : 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="derivation-math" dangerouslySetInnerHTML={{ __html: renderMath(line.tex, true) }} />
              {line.label && <span className="derivation-label"><Text>{line.label}</Text></span>}
            </motion.li>
          ))}
        </ol>
        {slide.figure && (
          <figure className="derivation-figure" style={slide.figure.width ? { flexBasis: slide.figure.width } : undefined}>
            <Media item={slide.figure} />
            {slide.figure.caption && <figcaption><Text>{slide.figure.caption}</Text></figcaption>}
          </figure>
        )}
      </div>
    </div>
  );
}
