/**
 * Layouts of this presentation, by the name slides use in `"layout"`.
 * Core layouts (core/client/layouts/index.js) are available without being
 * listed here; a name may not repeat a core one.
 */
import DiffusionModelSlide from './DiffusionModelSlide/DiffusionModelSlide.jsx';
import DiffusionRandomnessSlide from './DiffusionRandomnessSlide/DiffusionRandomnessSlide.jsx';
import DiffusionSliderSlide from './DiffusionSliderSlide/DiffusionSliderSlide.jsx';
import DiffusionTitleSlide from './DiffusionTitleSlide/DiffusionTitleSlide.jsx';
import EmbeddingClustersSlide from './EmbeddingClustersSlide/EmbeddingClustersSlide.jsx';
import EmbeddingSpaceSlide from './EmbeddingSpaceSlide/EmbeddingSpaceSlide.jsx';
import GenAiDemoSlide from './GenAiDemoSlide/GenAiDemoSlide.jsx';
import GenAiOverviewSlide from './GenAiOverviewSlide/GenAiOverviewSlide.jsx';
import GenerationOverviewSlide from './GenerationOverviewSlide/GenerationOverviewSlide.jsx';
import NoiseDefinitionSlide from './NoiseDefinitionSlide/NoiseDefinitionSlide.jsx';

export default {
  diffusionTitle: DiffusionTitleSlide,
  diffusionSlider: DiffusionSliderSlide,
  noiseDefinition: NoiseDefinitionSlide,
  diffusionModel: DiffusionModelSlide,
  diffusionRandomness: DiffusionRandomnessSlide,
  embeddingSpace: EmbeddingSpaceSlide,
  embeddingClusters: EmbeddingClustersSlide,
  generationOverview: GenerationOverviewSlide,
  genAiDemo: GenAiDemoSlide,
  genAiOverview: GenAiOverviewSlide,
};
