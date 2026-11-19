import { stepCount } from '@core/presentation/model.js';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import './RelatedWork.css';

/** Opacity of a column out of the spotlight. */
const DIMMED = 0.3;

/**
 * Related work by category: one column per category (its name, a square
 * picture or looping video, a caption, and one limitation line in red),
 * spotlighted one per build step; on the last step every column is dimmed
 * and the contribution line shows, in green, under them.
 *
 * Fields:
 *   title          the slide's title.
 *   columns        each { name, media, caption, limitation, hidden? }:
 *                  `hidden` { x, y, width, height } marks the region hidden
 *                  in the input view with a thin red rectangle, as
 *                  fractions of the picture.
 *   contribution   the line shown at the last step.
 *   buildSteps     one step per column, then the contribution step.
 *
 * The limitation line of a column appears with its spotlight and stays.
 */
export default function RelatedWork({ slide, buildStep }) {
  const { columns, contribution } = slide;
  if (stepCount(slide) !== columns.length + 1) {
    throw new Error(`Slide "${slide.id}": the relatedWork layout needs ${columns.length + 1} build steps, one per column and one for the contribution`);
  }
  return (
    <div className="slide--related-work">
      <SlideTitle title={slide.title} />
      <div className="related-work-body">
        <div className="related-work-columns">
          {columns.map((column, index) => (
            <figure key={column.name} className="related-work-column" style={{ opacity: buildStep === index ? 1 : DIMMED }}>
              <h3 className="related-work-name"><Text>{column.name}</Text></h3>
              <div className="related-work-picture">
                <Media item={column.media} className="related-work-media" />
                {column.hidden && (
                  <div
                    className="related-work-hidden"
                    style={{
                      left: `${100 * column.hidden.x}%`,
                      top: `${100 * column.hidden.y}%`,
                      width: `${100 * column.hidden.width}%`,
                      height: `${100 * column.hidden.height}%`,
                    }}
                  />
                )}
              </div>
              <figcaption className="related-work-caption"><Text>{column.caption}</Text></figcaption>
              <p className="related-work-limitation" style={{ opacity: buildStep >= index ? 1 : 0 }}>
                <Text>{column.limitation}</Text>
              </p>
            </figure>
          ))}
        </div>
        <p className="related-work-contribution" style={{ opacity: buildStep >= columns.length ? 1 : 0 }}>
          <Text>{contribution}</Text>
        </p>
      </div>
    </div>
  );
}
