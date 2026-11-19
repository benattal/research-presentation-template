/**
 * A captured video of propagating light beside its time axis: the video
 * plays with a readout of the time it shows, a playhead moves along the
 * axis, and each kind of light (direct, indirect) appears on a build step
 * as the intervals during which it is in the video, with one still frame
 * at a labeled time.
 *
 * Fields:
 *   title    the slide's title.
 *   video    { src, startNs, nsPerSecond }: the video, the time (ns) its
 *            first frame shows, and the nanoseconds of light travel per
 *            second of video.
 *   axis     [fromNs, toNs]: the range of the time axis.
 *   lights   each { kind: 'direct' | 'indirect', label, step, intervals:
 *            [[fromNs, toNs], ...], still: { src, ns } }: the label, the
 *            build step it appears at, the intervals drawn as a band, and a
 *            still frame with the time it shows.
 *
 * The readout and the playhead read the video's own clock, on every
 * animation frame and on every seek (how the record view moves a video), so
 * they show the frame on screen however the video is driven.
 */
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Media from '@core/stage/Media.jsx';
import SlideTitle from '@core/stage/SlideTitle.jsx';
import './LightVideo.css';

/** Stage pixels: the video, the timeline panel right of it, and the parts of the timeline. */
const VIDEO_SIZE = 440;
const PANEL_WIDTH = 640;
const STILL_SIZE = 248;
const BAND_TOP = 336;
const BAND_HEIGHT = 10;
const BAND_GAP = 14;
const AXIS_TOP = BAND_TOP + 2 * BAND_HEIGHT + BAND_GAP + 16;
const AXIS_INSET = 16;

const fade = (visible) => ({ initial: false, animate: { opacity: visible ? 1 : 0 }, transition: { duration: 0.4 } });

function formatNs(ns) {
  return `${ns.toFixed(2)} ns`;
}

export default function LightVideo({ slide, buildStep }) {
  const { video, axis, lights } = slide;
  const videoHolder = useRef(null);
  const readout = useRef(null);
  const playhead = useRef(null);

  const [fromNs, toNs] = axis;
  const axisWidth = PANEL_WIDTH - 2 * AXIS_INSET;
  const x = (ns) => AXIS_INSET + (axisWidth * (ns - fromNs)) / (toNs - fromNs);

  useEffect(() => {
    const element = videoHolder.current.querySelector('video');
    const show = () => {
      const ns = video.startNs + video.nsPerSecond * element.currentTime;
      readout.current.textContent = formatNs(ns);
      playhead.current.style.transform = `translateX(${x(ns)}px)`;
    };
    let frame = requestAnimationFrame(function tick() {
      show();
      frame = requestAnimationFrame(tick);
    });
    element.addEventListener('seeked', show);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('seeked', show);
    };
  });

  const ticks = [];
  for (let ns = Math.ceil(fromNs); ns <= toNs; ns += 1) ticks.push(ns);
  // Stills sit at the panel's two ends, in the order of their times.
  const stillLeft = (index) => (index === 0 ? 0 : PANEL_WIDTH - STILL_SIZE);

  return (
    <div className="slide--light-video">
      <SlideTitle title={slide.title} />
      <div className="light-video-stage">
        <div className="light-video-frame" ref={videoHolder} style={{ width: VIDEO_SIZE, height: VIDEO_SIZE }}>
          <Media item={{ type: 'video', src: video.src }} className="light-video-media" />
          <div className="light-video-readout">
            <span className="light-video-tau">τ</span> = <span ref={readout}>{formatNs(video.startNs)}</span>
          </div>
        </div>

        <div className="light-video-panel" style={{ width: PANEL_WIDTH, height: AXIS_TOP + 56 }}>
          {lights.map((light, index) => (
            <motion.div key={light.kind} className="light-video-light" {...fade(buildStep >= light.step)}>
              <figure className="light-video-still" style={{ left: stillLeft(index), width: STILL_SIZE }}>
                <img src={light.still.src} alt="" style={{ width: STILL_SIZE, height: STILL_SIZE }} />
                <figcaption className={`light-video-caption light-video-caption--${light.kind}`}>
                  {light.label}, {formatNs(light.still.ns)}
                </figcaption>
              </figure>
              <svg className="light-video-leader" width={PANEL_WIDTH} height={AXIS_TOP}>
                <line
                  x1={stillLeft(index) + STILL_SIZE / 2}
                  y1={STILL_SIZE + 34}
                  x2={x(light.still.ns)}
                  y2={BAND_TOP + index * (BAND_HEIGHT + BAND_GAP) - 4}
                />
              </svg>
              {light.intervals.map(([start, end]) => (
                <div
                  key={start}
                  className={`light-video-band light-video-band--${light.kind}`}
                  style={{
                    left: x(start),
                    width: x(end) - x(start),
                    top: BAND_TOP + index * (BAND_HEIGHT + BAND_GAP),
                    height: BAND_HEIGHT,
                  }}
                />
              ))}
            </motion.div>
          ))}

          <div className="light-video-axis" style={{ top: AXIS_TOP, left: AXIS_INSET, width: axisWidth }} />
          {ticks.map((ns) => (
            <div key={ns} className="light-video-tick" style={{ top: AXIS_TOP, left: x(ns) }}>
              <span>{ns}</span>
            </div>
          ))}
          <div className="light-video-axis-label" style={{ top: AXIS_TOP + 30 }}>time (ns)</div>
          <div className="light-video-playhead" ref={playhead} style={{ top: BAND_TOP - 8, height: AXIS_TOP - BAND_TOP + 8 }} />
        </div>
      </div>
    </div>
  );
}
