/**
 * A photograph with its parts named: each label sits in the margin left or
 * right of the photo, joined to its part by a thin line, and appears on a
 * build step. Optional insets (images or videos) appear together beside
 * the photo on a later step; then the labels fold away and the photo moves
 * left, so the photo and the insets sit centered in one row.
 *
 * Fields:
 *   title   the slide's title.
 *   photo   { src, alt, width, height }: the photo and its size on the
 *           stage, in pixels.
 *   labels  each { text, x, y, labelX?, labelY?, side: 'left' | 'right',
 *           step }: the label (a newline breaks it), the part's position
 *           as fractions of the photo, where the label's line ends (a
 *           fraction of the photo, below 0 or above 1 in the margins; the
 *           margin's inner edge when absent) and the height the label
 *           sits at (the part's height when absent, otherwise the line
 *           runs at a slant), the side of the line's end the label sits
 *           on, and the build step it appears at.
 *   insets  optional { step, size, photoScale?, gap?, items }: the build
 *           step the insets appear at, their size (square, stage pixels),
 *           how much the photo shrinks to make room for them (1 when
 *           absent), the gap between the photo and the first inset (stage
 *           pixels, 40 when absent; below 0 to overlap the photo's own
 *           black margin), and
 *           the items in order from the photo outward, each a media item
 *           ({ type: 'image' | 'video', src, alt?, poster? }) with a
 *           `label` shown under it.
 */
import Media from '@core/stage/Media.jsx';
import { mediaUrl } from '@core/presentation/preload.js';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import './AnnotatedPhoto.css';

/** Stage pixels: the width of each margin, the gap between a label and the end of its line, and the gaps before and between the insets. */
const MARGIN = 250;
const LABEL_GAP = 10;
const INSET_GAP = 40;
const INSET_SPACING = 24;

export default function AnnotatedPhoto({ slide, buildStep }) {
  const { photo, labels, insets } = slide;
  const width = photo.width + 2 * MARGIN;
  const showInsets = insets !== undefined && buildStep >= insets.step;
  // With the insets shown, the photo shrinks to its inset scale and the photo and the insets are centered together in the figure.
  const scale = showInsets ? (insets.photoScale ?? 1) : 1;
  const insetsLeft = MARGIN + photo.width * (insets?.photoScale ?? 1) + (insets?.gap ?? INSET_GAP);
  const row = insets ? insetsLeft - MARGIN + insets.items.length * insets.size + (insets.items.length - 1) * INSET_SPACING : 0;
  const shift = showInsets ? (width - row) / 2 - MARGIN : 0;
  return (
    <div className="slide--annotated-photo">
      <SlideTitle title={slide.title} />
      <div className="annotated-photo-stage">
        <div className="annotated-photo-figure" style={{ width, height: photo.height, transform: `translateX(${shift}px)` }}>
          <img
            className="annotated-photo-image"
            src={mediaUrl(photo.src)}
            alt={photo.alt}
            style={{ left: MARGIN, width: photo.width, height: photo.height, transform: `scale(${scale})` }}
          />
          {labels.map((label) => {
            const partX = MARGIN + label.x * photo.width;
            const partY = label.y * photo.height;
            const textY = (label.labelY ?? label.y) * photo.height;
            const left = label.side === 'left';
            const lineEnd = label.labelX !== undefined
              ? MARGIN + label.labelX * photo.width
              : left ? MARGIN - 30 : MARGIN + photo.width + 30;
            return (
              <div
                key={label.text}
                className="annotated-photo-label-layer"
                style={{ opacity: buildStep >= label.step && !showInsets ? 1 : 0 }}
              >
                <svg className="annotated-photo-lines" width={width} height={photo.height}>
                  <line x1={lineEnd} y1={textY} x2={partX} y2={partY} />
                  <circle cx={partX} cy={partY} r="3.5" />
                </svg>
                <div
                  className={`annotated-photo-label annotated-photo-label--${label.side}`}
                  style={left
                    ? { right: width - lineEnd + LABEL_GAP, top: textY }
                    : { left: lineEnd + LABEL_GAP, top: textY }}
                >
                  {label.text}
                </div>
              </div>
            );
          })}
          {insets?.items.map((item, i) => (
            <figure
              key={item.src}
              className="annotated-photo-inset"
              style={{
                left: insetsLeft + i * (insets.size + INSET_SPACING),
                width: insets.size,
                opacity: showInsets ? 1 : 0,
              }}
            >
              <Media item={item} className="annotated-photo-inset-media" />
              <figcaption>{item.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
