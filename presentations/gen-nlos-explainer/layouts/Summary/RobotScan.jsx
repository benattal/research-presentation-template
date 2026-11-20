import { useRef } from 'react';
import { mediaUrl } from '@core/presentation/preload.js';
import { useStepClock } from '@core/stage/playback.js';

/**
 * Illustrative transient light on a generated image, not a physical simulation.
 * Elliptical bands sweep over hand-drawn surface masks in source-image pixels;
 * the step clock makes the same sequence play in the deck and recording.
 */
export default function RobotScan({ image, active }) {
  const svgRef = useRef(null);
  const duration = 7200;
  useStepClock(active, (ms) => {
    const root = svgRef.current;
    if (!root || !active) return;
    const time = Math.min(ms, duration - 1) % 3600;
    const direct = root.querySelector('[data-direct-wave]');
    const indirect = root.querySelector('[data-indirect-wave]');
    const directProgress = Math.min(1, time / 2350);
    const indirectProgress = Math.max(0, Math.min(1, (time - 1200) / 2100));
    const envelope = (progress) => Math.sin(Math.PI * progress) ** 0.6;
    direct.setAttribute('rx', String(60 + directProgress * 1180));
    direct.setAttribute('ry', String(35 + directProgress * 760));
    direct.setAttribute('opacity', String(envelope(directProgress) * 0.9));
    indirect.setAttribute('rx', String(20 + indirectProgress * 880));
    indirect.setAttribute('ry', String(15 + indirectProgress * 240));
    indirect.setAttribute('opacity', String(envelope(indirectProgress) * 0.8));
  }, { still: 2050, until: duration });

  return (
    <div className="summary-robot-scan">
      <img src={mediaUrl(image.src)} alt={image.alt} />
      <svg ref={svgRef} className="summary-robot-overlay" viewBox="0 0 1672 941" aria-hidden="true">
        <defs>
          <filter id="robot-light-soften" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="45" />
          </filter>
          <filter id="robot-indirect-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luminance" />
            <feFlood floodColor="var(--indirect)" result="amber" />
            <feComposite in="amber" in2="luminance" operator="in" />
          </filter>
          {/* These broad masks are an illustration of surfaces, not estimated geometry. */}
          <clipPath id="robot-visible-surfaces">
            <path d="M 840 35 L 1672 0 L 1672 941 L 957 941 L 957 686 L 805 636 L 805 443 L 840 405 Z" />
            <path d="M 0 520 L 580 500 L 580 941 L 0 941 Z" />
          </clipPath>
          <clipPath id="robot-lidar-field">
            <path d="M 834 274 L 1672 0 L 1672 941 Z" />
          </clipPath>
          <mask id="robot-direct-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941">
            <ellipse data-direct-wave cx="834" cy="274" rx="60" ry="35" fill="none" stroke="white" strokeWidth="165" filter="url(#robot-light-soften)" opacity="0" />
          </mask>
          <mask id="robot-indirect-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941">
            <ellipse data-indirect-wave cx="1290" cy="590" rx="20" ry="15" transform="rotate(-18 1290 590)" fill="none" stroke="white" strokeWidth="185" filter="url(#robot-light-soften)" opacity="0" />
          </mask>
        </defs>
        <g clipPath="url(#robot-visible-surfaces)">
          <g clipPath="url(#robot-lidar-field)">
            <image href={mediaUrl(image.src)} width="1672" height="941" mask="url(#robot-direct-mask)" style={{ filter: 'brightness(2.8) saturate(0.2)' }} />
          </g>
          <image href={mediaUrl(image.src)} width="1672" height="941" mask="url(#robot-indirect-mask)" filter="url(#robot-indirect-tint)" />
        </g>
      </svg>
      <div className="summary-robot-legend"><span>Direct light</span><span>Indirect light</span></div>
    </div>
  );
}
