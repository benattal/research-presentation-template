/**
 * Layouts of this presentation, by the name slides use in `"layout"`.
 * Core layouts (core/client/layouts/index.js) are available without being
 * listed here; a name may not repeat a core one.
 */
import BinaryCountSlide from './BinaryCountSlide/BinaryCountSlide.jsx';
import CardGridSlide from './CardGridSlide/CardGridSlide.jsx';
import FlowDiagramSlide from './FlowDiagramSlide/FlowDiagramSlide.jsx';
import SplitRevealSlide from './SplitRevealSlide/SplitRevealSlide.jsx';
import VideoShowcaseSlide from './VideoShowcaseSlide/VideoShowcaseSlide.jsx';

export default {
  binaryCount: BinaryCountSlide,
  cardGrid: CardGridSlide,
  flowDiagram: FlowDiagramSlide,
  splitReveal: SplitRevealSlide,
  videoShowcase: VideoShowcaseSlide,
};
