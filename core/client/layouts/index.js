/**
 * The framework's layouts, by the name a slide's `content.json` gives in
 * its `"layout"` field. A presentation adds its own in
 * `presentations/<id>/layouts/index.js`; a name may not be registered
 * twice. Each layout's fields are listed in docs/implementation/layouts.md.
 */
import ColabLinkSlide from './ColabLinkSlide/ColabLinkSlide.jsx';
import ContentSlide from './ContentSlide/ContentSlide.jsx';
import DiagramSlide from './DiagramSlide/DiagramSlide.jsx';
import DiscussionSlide from './DiscussionSlide/DiscussionSlide.jsx';
import IllustratedPointsSlide from './IllustratedPointsSlide/IllustratedPointsSlide.jsx';
import MediaSlide from './MediaSlide/MediaSlide.jsx';
import NumericPollSlide from './NumericPollSlide/NumericPollSlide.jsx';
import OutlineSlide from './OutlineSlide/OutlineSlide.jsx';
import PollResultsSlide from './PollResultsSlide/PollResultsSlide.jsx';
import PollSlide from './PollSlide/PollSlide.jsx';
import PresentationLinksSlide from './PresentationLinksSlide/PresentationLinksSlide.jsx';
import ProgressiveBuildSlide from './ProgressiveBuildSlide/ProgressiveBuildSlide.jsx';
import TitleSlide from './TitleSlide/TitleSlide.jsx';

export default {
  title: TitleSlide,
  outline: OutlineSlide,
  content: ContentSlide,
  progressiveBuild: ProgressiveBuildSlide,
  diagram: DiagramSlide,
  media: MediaSlide,
  illustratedPoints: IllustratedPointsSlide,
  discussion: DiscussionSlide,
  colabLink: ColabLinkSlide,
  poll: PollSlide,
  pollResults: PollResultsSlide,
  numericPoll: NumericPollSlide,
  presentationLinks: PresentationLinksSlide,
};
