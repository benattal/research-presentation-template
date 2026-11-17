/**
 * Layouts of this presentation, by the name slides use in `"layout"`.
 * Core layouts (core/client/layouts/index.js) are available without being
 * listed here; a name may not repeat a core one.
 */
import ConvolutionAnimationSlide from './ConvolutionAnimationSlide/ConvolutionAnimationSlide.jsx';
import FilterDesignerSlide from './FilterDesignerSlide/FilterDesignerSlide.jsx';
import FilterStackSlide from './FilterStackSlide/FilterStackSlide.jsx';
import ImagePipelineSlide from './ImagePipelineSlide/ImagePipelineSlide.jsx';
import ImagePollSlide from './ImagePollSlide/ImagePollSlide.jsx';
import KernelPollResultsSlide from './KernelPollResultsSlide/KernelPollResultsSlide.jsx';
import KernelPollSlide from './KernelPollSlide/KernelPollSlide.jsx';
import MultiFilterCompareSlide from './MultiFilterCompareSlide/MultiFilterCompareSlide.jsx';
import RevealCompareSlide from './RevealCompareSlide/RevealCompareSlide.jsx';
import SpatialBlurDemoSlide from './SpatialBlurDemoSlide/SpatialBlurDemoSlide.jsx';
import TemporalBlurDemoSlide from './TemporalBlurDemoSlide/TemporalBlurDemoSlide.jsx';

export default {
  convolutionAnimation: ConvolutionAnimationSlide,
  filterDesigner: FilterDesignerSlide,
  filterStack: FilterStackSlide,
  imagePipeline: ImagePipelineSlide,
  imagePoll: ImagePollSlide,
  kernelPoll: KernelPollSlide,
  kernelPollResults: KernelPollResultsSlide,
  multiFilterCompare: MultiFilterCompareSlide,
  revealCompare: RevealCompareSlide,
  spatialBlurDemo: SpatialBlurDemoSlide,
  temporalBlurDemo: TemporalBlurDemoSlide,
};
