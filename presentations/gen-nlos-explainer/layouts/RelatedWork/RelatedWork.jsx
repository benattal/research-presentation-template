import { useEffect, useRef } from 'react';
import { stepCount } from '@core/presentation/model.js';
import { mediaUrl } from '@core/presentation/preload.js';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import Text from '@core/stage/Text.jsx';
import { Boxes } from '../Panels/Panels.jsx';
import './RelatedWork.css';

/** Opacity of groups outside the spotlight and behind the contribution. */
const DIMMED = 0.08;
const CONTEXT = 0.05;

/**
 * Related work by category, with what each line of work offers and lacks.
 * Each group is a panel of one or more columns; a column has an optional
 * name, a row of method tiles (each a clip from the method, named under
 * it with its citation), and its strengths (green, "+") and limitations
 * (red, "−"). One group is spotlighted per build step; on the
 * last step every group fades nearly to black and a centered contribution
 * panel shows its title and strengths. Every tile has one citation line, so
 * the strengths start on one line across every column.
 *
 * Fields:
 *   title          the slide's title.
 *   video          { src, poster?, alt?, tileSize, tileLefts }: one video
 *                  holding every tile's clip side by side, so the clips stay
 *                  in step: squares of `tileSize` video pixels at the
 *                  `tileLefts` offsets (assets/build/related-work.py writes
 *                  it). Each tile draws its square onto a canvas.
 *   groups         each { name, columns }; a column is { name?, tiles,
 *                  pros, cons }:
 *                    tiles       each { method, citation, frame, boxes? }:
 *                                the method's name, "Authors et al. Year"
 *                                of its paper, the index of its square in
 *                                the video, and hidden-region rectangles as
 *                                the panels layout's ({ x, y, width, height }
 *                                in fractions of the tile, with optional
 *                                { from, to } in seconds of the video);
 *                    pros        short phrases;
 *                    cons        each { text, solved } for a limitation and its corresponding contribution.
 *   contribution   the line shown, in its panel, on the last step.
 *   contributionPros  strengths listed in green beneath the contribution.
 *   note           optional: a short line under the panels, at their left
 *                  edge (what an asterisk after a method's name marks).
 *   buildSteps     one step per group, then the contribution step.
 */
export default function RelatedWork({ slide, buildStep }) {
  const { groups, contribution, contributionPros, note, video } = slide;
  const videoHolder = useRef(null);
  const canvases = useRef(new Map());
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error(`Slide "${slide.id}": the relatedWork layout needs a non-empty "groups" list`);
  }
  if (stepCount(slide) !== groups.length + 1) {
    throw new Error(`Slide "${slide.id}": the relatedWork layout needs ${groups.length + 1} build steps, one per group and one for the contribution`);
  }
  const unsolved = groups.flatMap((group) => group.columns.flatMap((column) => column.cons)).filter((con) => !con?.text || !con?.solved);
  if (unsolved.length > 0) {
    throw new Error(`Slide "${slide.id}": every limitation needs text and solved descriptions`);
  }
  useTileFrames(videoHolder, canvases, video);
  const solved = buildStep >= groups.length;
  const spotlight = (index) => {
    if (buildStep >= groups.length) return CONTEXT;
    return buildStep === index ? 1 : DIMMED;
  };

  return (
    <div className="slide--related-work" data-contribution={buildStep >= groups.length ? 'shown' : 'hidden'}>
      <SlideTitle title={slide.title} />
      <div className="related-work-body">
        <div className="related-work-figure">
          {/* The clips' source: under the opaque panels, in the layout so the browser keeps it playing. */}
          <div ref={videoHolder} className="related-work-video">
            <Media item={{ type: 'video', ...video }} className="related-work-video-media" />
          </div>
          <div className="related-work-groups">
            {groups.map((group, index) => (
              <section key={group.name} className="related-work-group" style={{ opacity: spotlight(index) }}>
                <div className="related-work-group-content">
                  <h3 className="related-work-name"><Text>{group.name}</Text></h3>
                  <div className="related-work-columns">
                    {group.columns.map((column, c) => (
                      <div key={column.name ?? c} className="related-work-column">
                        <h4 className="related-work-column-name"><Text>{column.name ?? ''}</Text></h4>
                        <div className="related-work-tiles">
                          {column.tiles.map((tile) => (
                            <figure key={tile.method} className="related-work-tile">
                              <div className="related-work-picture">
                                <canvas
                                  ref={(element) => {
                                    if (element) canvases.current.set(tile.method, { element, frame: tile.frame });
                                    else canvases.current.delete(tile.method);
                                  }}
                                  className="related-work-canvas"
                                  width={video.tileSize}
                                  height={video.tileSize}
                                />
                                {tile.boxes && <Boxes boxes={tile.boxes} videoHolder={videoHolder} />}
                              </div>
                              <figcaption>
                                <div className="related-work-method"><Text>{tile.method}</Text></div>
                                <div className="related-work-citation"><Text>{tile.citation}</Text></div>
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                        <ul className="related-work-traits">
                          {column.pros.map((pro) => <li key={pro} className="related-work-pro"><Text>{pro}</Text></li>)}
                          {column.cons.map((con) => (
                            <li key={con.text} className={`related-work-con${solved ? ' related-work-con--solved' : ''}`}>
                              <span className="related-work-con-text">
                                <span className="related-work-con-was"><Text>{con.text}</Text></span>
                                <span className="related-work-con-now"><Text>{con.solved}</Text></span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
          <section className="related-work-contribution" style={{ opacity: buildStep >= groups.length ? 1 : 0 }}>
            <h3 className="related-work-contribution-name"><Text>{contribution}</Text></h3>
            <ul className="related-work-contribution-pros">
              {contributionPros.map((pro) => <li key={pro} className="related-work-pro"><Text>{pro}</Text></li>)}
            </ul>
          </section>
          {note && <p className="related-work-note"><Text>{note}</Text></p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Draws each tile's square of the video onto its canvas, every animation
 * frame, all from the one video so the clips stay in step; the poster
 * stands in until the video has a frame.
 */
function useTileFrames(videoHolder, canvases, video) {
  useEffect(() => {
    const element = videoHolder.current?.querySelector('video');
    if (!element) throw new Error('relatedWork layout: the tiles need the video under them');
    const poster = video.poster ? Object.assign(new Image(), { src: mediaUrl(video.poster) }) : null;
    let frame = requestAnimationFrame(function draw() {
      const source = element.readyState >= 2 ? element : poster?.complete && poster.naturalWidth > 0 ? poster : null;
      if (source) {
        for (const { element: canvas, frame: index } of canvases.current.values()) {
          const left = video.tileLefts[index];
          if (left === undefined) throw new Error(`relatedWork layout: no square ${index} in the video`);
          canvas.getContext('2d').drawImage(source, left, 0, video.tileSize, video.tileSize, 0, 0, video.tileSize, video.tileSize);
        }
      }
      frame = requestAnimationFrame(draw);
    });
    return () => cancelAnimationFrame(frame);
  }, [videoHolder, canvases, video]);
}
