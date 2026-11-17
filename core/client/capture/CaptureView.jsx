import { useEffect, useRef } from 'react';
import { MotionGlobalConfig } from 'framer-motion';
import { stepCount } from '../presentation/model.js';
import { clampPosition } from '../navigation/position.js';
import Stage from '../stage/Stage.jsx';
import SlideFrame from '../stage/SlideFrame.jsx';

/** How long to wait for one image or video before reporting it as not loaded. */
const MEDIA_TIMEOUT_MS = 10000;

/** Tolerance, in CSS pixels, before a box counts as overflowing. */
const OVERFLOW_TOLERANCE_PX = 2;

function describe(element) {
  const classes = [...element.classList].map((name) => `.${name}`).join('');
  const text = element.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
  return `${element.tagName.toLowerCase()}${classes}${text ? ` "${text}"` : ''}`;
}

function waitFor(target, events) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('timeout'), MEDIA_TIMEOUT_MS);
    for (const name of events) {
      target.addEventListener(name, () => {
        clearTimeout(timer);
        resolve(name);
      }, { once: true });
    }
  });
}

async function settleMedia(root) {
  const problems = [];
  await Promise.all([...root.querySelectorAll('img')].map(async (image) => {
    if (!image.complete) await waitFor(image, ['load', 'error']);
    if (image.naturalWidth === 0) problems.push(`image did not load: ${image.currentSrc || image.src}`);
    else await image.decode().catch(() => {});
  }));
  await Promise.all([...root.querySelectorAll('video')].map(async (video) => {
    if (video.readyState < 2) {
      const outcome = await waitFor(video, ['loadeddata', 'error']);
      if (outcome !== 'loadeddata') problems.push(`video did not load: ${video.currentSrc || video.src}`);
    }
    video.pause();
  }));
  return problems;
}

function clips(style) {
  return style.overflowX !== 'visible' || style.overflowY !== 'visible';
}

/**
 * The part of an element's box left visible by its clipping ancestors
 * inside the slide. The slide and stage themselves are not counted: content
 * they cut off is exactly what this check looks for.
 */
function visibleBox(element, slide) {
  const box = element.getBoundingClientRect();
  let { left, top, right, bottom } = box;
  for (let ancestor = element.parentElement; ancestor && ancestor !== slide; ancestor = ancestor.parentElement) {
    if (!clips(getComputedStyle(ancestor))) continue;
    const clip = ancestor.getBoundingClientRect();
    left = Math.max(left, clip.left);
    top = Math.max(top, clip.top);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  return { left, top, right, bottom };
}

/**
 * The box that lays out the line a text node sits on, within `slide`: the
 * parent of the text's outermost inline-level ancestor (or its own parent).
 * Inline boxes and inline-blocks take the width of their content, so text
 * runs out of this box, not of them; and the blocks inside an inline-block
 * (KaTeX stacks superscripts and accents in such blocks, offset by negative
 * margins) belong to that inline-block's own layout.
 */
function lineContainer(textNode, slide) {
  let container = textNode.parentElement;
  for (let element = textNode.parentElement; element !== slide; element = element.parentElement) {
    const { display } = getComputedStyle(element);
    if (display.startsWith('inline') || display === 'contents') container = element.parentElement;
  }
  return container;
}

/**
 * The slide's visible text nodes, grouped by the box that lays out their
 * lines (`lineContainer`). Text in SVG is positioned by its drawing and
 * left out, as is text clipped to nothing on purpose (KaTeX's MathML copy
 * for screen readers).
 */
function textByLineContainer(slide) {
  const containers = new Map();
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!node.textContent.trim() || parent.closest('svg, [data-overflow-ok]')) continue;
    if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const visible = visibleBox(parent, slide);
    if (visible.right - visible.left <= 1 || visible.bottom - visible.top <= 1) continue;
    const container = lineContainer(node, slide);
    containers.set(container, [...(containers.get(container) ?? []), node]);
  }
  return containers;
}

/**
 * Text wider than the box that lays it out, in a box that does not clip: a
 * line that does not wrap (a formula, a long word, `nowrap`) in a column
 * too narrow for it. The box keeps its width, so no element box shows the
 * line; it spills over its neighbors, or past the stage edge, which cuts it
 * off. Horizontal only: glyphs may reach above and below a tight line
 * height without overlapping anything.
 */
function textPastItsBox(textByContainer) {
  const findings = [];
  for (const [container, nodes] of textByContainer) {
    const style = getComputedStyle(container);
    if (clips(style)) continue;
    const box = container.getBoundingClientRect();
    const left = box.left + parseFloat(style.borderLeftWidth);
    const right = box.right - parseFloat(style.borderRightWidth);
    const lines = nodes.flatMap((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()];
    });
    const past = Math.max(0, ...lines.map((line) => Math.max(left - line.left, line.right - right)));
    if (past > OVERFLOW_TOLERANCE_PX) {
      findings.push({ kind: 'text-past-box', element: describe(container), detail: `text runs ${Math.round(past)}px past its box` });
    }
  }
  return findings;
}

/**
 * Content that does not fit: the slide itself scrolling, text cut off by
 * the box that lays it out or running out of it, or visible content
 * reaching outside the 1280×720 stage (reported once, for the outermost
 * such element). Content a layout clips on purpose, inside its own
 * `overflow: hidden` box, is not reported; a subtree marked
 * `data-overflow-ok` (a full-bleed background) is skipped.
 */
function findOverflow(stageElement) {
  const findings = [];
  const slide = stageElement.querySelector('.slide');
  const stage = stageElement.getBoundingClientRect();
  const textByContainer = textByLineContainer(slide);

  const extraHeight = slide.scrollHeight - slide.clientHeight;
  if (extraHeight > OVERFLOW_TOLERANCE_PX) {
    findings.push({ kind: 'slide-scrolls', element: '.slide', detail: `content is ${extraHeight}px taller than the slide` });
  }

  const reported = new Set();
  for (const element of slide.querySelectorAll('*')) {
    if (element.closest('[data-overflow-ok]')) continue;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;

    const hiddenWidth = element.scrollWidth - element.clientWidth;
    const hiddenHeight = element.scrollHeight - element.clientHeight;
    if (clips(style) && textByContainer.has(element) && (hiddenWidth > OVERFLOW_TOLERANCE_PX || hiddenHeight > OVERFLOW_TOLERANCE_PX)) {
      findings.push({ kind: 'clipped', element: describe(element), detail: `${hiddenWidth}px × ${hiddenHeight}px of text hidden` });
    }

    const visible = visibleBox(element, slide);
    const shown = visible.right > visible.left && visible.bottom > visible.top;
    const outside = shown && (visible.left < stage.left - OVERFLOW_TOLERANCE_PX
      || visible.top < stage.top - OVERFLOW_TOLERANCE_PX
      || visible.right > stage.right + OVERFLOW_TOLERANCE_PX
      || visible.bottom > stage.bottom + OVERFLOW_TOLERANCE_PX);
    const ancestorReported = [...reported].some((ancestor) => ancestor.contains(element));
    if (outside && !ancestorReported) {
      reported.add(element);
      findings.push({
        kind: 'outside-stage',
        element: describe(element),
        detail: `visible box ${Math.round(visible.left)},${Math.round(visible.top)} to ${Math.round(visible.right)},${Math.round(visible.bottom)}`,
      });
    }
  }
  findings.push(...textPastItsBox(textByContainer));
  return findings;
}

/**
 * One slide at one build step, at design size, with every animation
 * finished: the page `scripts/capture.mjs` screenshots
 * (`?mode=capture&slide=<index>&step=<step>`).
 *
 * When fonts, images, and videos have settled it publishes
 * `window.__captureReport` (media that failed to load, overflow findings)
 * and sets `data-capture-ready` on `<body>`. `window.__presentationIndex`
 * lists every slide and its step count, so the capture script knows what
 * to visit.
 */
export default function CaptureView({ presentation }) {
  // Finish every framer-motion animation immediately. Set during render so
  // it is in place before the first animation starts; it is a global the
  // capture page never needs to restore.
  MotionGlobalConfig.skipAnimations = true;

  const stageRef = useRef(null);
  const params = new URLSearchParams(window.location.search);
  const position = clampPosition(presentation.slides, {
    index: Number(params.get('slide') ?? 0),
    step: Number(params.get('step') ?? 0),
  });
  const slide = presentation.slides[position.index];

  useEffect(() => {
    window.__presentationIndex = presentation.slides.map((each) => ({
      id: each.id,
      title: each.title ?? '',
      layout: each.layout,
      steps: stepCount(each),
    }));
    let cancelled = false;
    (async () => {
      await document.fonts.ready;
      const mediaProblems = await settleMedia(stageRef.current);
      // Two frames for layouts that draw on a canvas after their images load.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (cancelled) return;
      window.__captureReport = {
        slide: slide.id,
        index: position.index,
        step: position.step,
        mediaProblems,
        overflow: findOverflow(stageRef.current.querySelector('.slide-stage')),
      };
      document.body.dataset.captureReady = 'true';
    })();
    return () => { cancelled = true; };
  }, [presentation, slide, position.index, position.step]);

  return (
    <div className="presentation capture-mode" ref={stageRef}>
      <Stage scale={1}>
        <SlideFrame
          presentation={presentation}
          slide={slide}
          buildStep={position.step}
          direction={1}
          transition="none"
        />
      </Stage>
    </div>
  );
}
