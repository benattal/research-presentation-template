import Media from '@core/stage/Media.jsx';
import Text from '@core/stage/Text.jsx';
import './SectionCard.css';

/**
 * A section's divider card, silent in the recording: one picture or looping
 * video from the results that previews the section, with the section's name
 * under it in the accent color, both centered on the slide.
 *
 * Fields: `title` (the section's name) and `media` (one media item; a video
 * plays muted and loops). The media box is 340 px high on every card, its
 * width set by the media's aspect ratio, so the name sits at the same place
 * on each card; media are encoded 510 px high (1.5x).
 */
export default function SectionCard({ slide }) {
  if (!slide.media) throw new Error(`sectionCard slide "${slide.id}" needs a media item`);
  return (
    <div className="section-card">
      <Media item={slide.media} className="section-card-media" />
      <h2 className="section-card-title"><Text>{slide.title}</Text></h2>
    </div>
  );
}
