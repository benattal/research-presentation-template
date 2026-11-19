import { Fragment, useRef } from 'react';
import { stepCount } from '@core/presentation/model.js';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Boxes } from '../Panels/Panels.jsx';
import './RelatedWork.css';

/** Opacity of a group's pictures and text out of the spotlight. */
const DIMMED = 0.3;

/**
 * Related work by category: one group per category on a quiet panel, each a
 * row of method tiles. A tile is a picture produced by the method named
 * under it, with a short citation and, in red, what the method lacks. One
 * group is spotlighted per build step; on the last step every group is
 * dimmed and the contribution line shows, in green, under them.
 *
 * Fields:
 *   title          the slide's title.
 *   video          { src, poster?, alt? }: one video holding every tile's
 *                  picture in a row, so the clips stay in step. Its geometry
 *                  is the stage's (RelatedWork.css) at a uniform scale:
 *                  squares of 200 stage pixels, 20 between the tiles of a
 *                  group, 68 between the last tile of a group and the first
 *                  of the next (two paddings of 20 and a gap of 28), the
 *                  gaps black. assets/build/related-work.py writes it.
 *   groups         each { name, tiles }: the category's name and its tiles,
 *                  each { method, citation, limitation, boxes? }:
 *                    method      the method's name, as the paper writes it;
 *                    citation    "Authors et al. Year";
 *                    limitation  a few words on what the method lacks (a
 *                                newline breaks the line);
 *                    boxes       hidden-region rectangles over the picture,
 *                                as the panels layout's: { x, y, width,
 *                                height } in fractions of the picture, with
 *                                optional { from, to }, the seconds of the
 *                                video during which the box shows.
 *   note           optional: a short line under the panels, at their left
 *                  edge (what an asterisk after a method's name marks).
 *   contribution   the line shown at the last step.
 *   buildSteps     one step per group, then the contribution step.
 *
 * A group is dimmed by a veil in the panel's shade over its pictures and
 * text, not by its own opacity: changing the opacity of an element that
 * holds a playing video makes some browsers rebuild the video's layer,
 * which shows as a flash. The video lies under the groups; each picture is
 * a window onto its part, and the panel's shade is drawn around the
 * windows.
 */
export default function RelatedWork({ slide, buildStep }) {
  const { groups, note, contribution, video } = slide;
  const videoHolder = useRef(null);
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error(`Slide "${slide.id}": the relatedWork layout needs a non-empty "groups" list`);
  }
  if (stepCount(slide) !== groups.length + 1) {
    throw new Error(`Slide "${slide.id}": the relatedWork layout needs ${groups.length + 1} build steps, one per group and one for the contribution`);
  }
  return (
    <div className="slide--related-work">
      <SlideTitle title={slide.title} />
      <div className="related-work-body">
        <div className="related-work-figure">
          <div ref={videoHolder} className="related-work-video">
            <Media item={{ type: 'video', ...video }} className="related-work-video-media" />
          </div>
          {groups.map((group, index) => (
            <Fragment key={group.name}>
              {index > 0 && <div className="related-work-between" />}
              <section className="related-work-group">
                <h3 className="related-work-name"><Text>{group.name}</Text></h3>
                <div className="related-work-pictures">
                  {group.tiles.map((tile) => (
                    <div key={tile.method} className="related-work-picture">
                      {tile.boxes && <Boxes boxes={tile.boxes} videoHolder={videoHolder} />}
                    </div>
                  ))}
                </div>
                <div className="related-work-captions">
                  {group.tiles.map((tile) => (
                    <div key={tile.method} className="related-work-caption">
                      <div className="related-work-method"><Text>{tile.method}</Text></div>
                      <div className="related-work-citation"><Text>{tile.citation}</Text></div>
                      <div className="related-work-limitation"><Text>{tile.limitation}</Text></div>
                    </div>
                  ))}
                </div>
                <div className="related-work-veil" style={{ opacity: buildStep === index ? 0 : 1 - DIMMED }} />
              </section>
            </Fragment>
          ))}
          {note && <p className="related-work-note"><Text>{note}</Text></p>}
        </div>
        <p className="related-work-contribution" style={{ opacity: buildStep >= groups.length ? 1 : 0 }}>
          <Text>{contribution}</Text>
        </p>
      </div>
    </div>
  );
}
