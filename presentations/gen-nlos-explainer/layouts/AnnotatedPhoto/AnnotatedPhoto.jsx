/**
 * A photograph with its parts named: each label sits in the margin left or
 * right of the photo, joined to its part by a thin line, and appears on a
 * build step. An optional inset image appears beside the photo on a step.
 *
 * Fields:
 *   title   the slide's title.
 *   photo   { src, alt, width, height }: the photo and its size on the
 *           stage, in pixels.
 *   labels  each { text, x, y, side: 'left' | 'right', step }: the label
 *           (a newline breaks it), the part's position as fractions of the
 *           photo, the margin the label sits in (at the part's height), and
 *           the build step it appears at.
 *   inset   optional { src, alt, label, step, size }: a square image at
 *           the bottom of the right margin, with its label under it.
 */
import SlideTitle from '@core/stage/SlideTitle.jsx';
import './AnnotatedPhoto.css';

/** Stage pixels: the width of each margin, and the gap between a label and the end of its line. */
const MARGIN = 250;
const LABEL_GAP = 10;

export default function AnnotatedPhoto({ slide, buildStep }) {
  const { photo, labels, inset } = slide;
  const width = photo.width + 2 * MARGIN;
  return (
    <div className="slide--annotated-photo">
      <SlideTitle title={slide.title} />
      <div className="annotated-photo-stage">
        <div className="annotated-photo-figure" style={{ width, height: photo.height }}>
          <img
            className="annotated-photo-image"
            src={photo.src}
            alt={photo.alt}
            style={{ left: MARGIN, width: photo.width, height: photo.height }}
          />
          {labels.map((label) => {
            const partX = MARGIN + label.x * photo.width;
            const partY = label.y * photo.height;
            const left = label.side === 'left';
            const lineEnd = left ? MARGIN - 30 : MARGIN + photo.width + 30;
            return (
              <div key={label.text} className="annotated-photo-label-layer" style={{ opacity: buildStep >= label.step ? 1 : 0 }}>
                <svg className="annotated-photo-lines" width={width} height={photo.height}>
                  <line x1={lineEnd} y1={partY} x2={partX} y2={partY} />
                  <circle cx={partX} cy={partY} r="3.5" />
                </svg>
                <div
                  className={`annotated-photo-label annotated-photo-label--${label.side}`}
                  style={left
                    ? { right: width - lineEnd + LABEL_GAP, top: partY }
                    : { left: lineEnd + LABEL_GAP, top: partY }}
                >
                  {label.text}
                </div>
              </div>
            );
          })}
          {inset && (
            <figure
              className="annotated-photo-inset"
              style={{ left: MARGIN + photo.width + 40, width: inset.size, opacity: buildStep >= inset.step ? 1 : 0 }}
            >
              <img src={inset.src} alt={inset.alt} style={{ width: inset.size, height: inset.size }} />
              <figcaption>{inset.label}</figcaption>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
