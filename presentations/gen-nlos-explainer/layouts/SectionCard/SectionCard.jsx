import Text from '@core/stage/Text.jsx';
import './SectionCard.css';

/**
 * A section's divider card, silent in the recording: the section's name,
 * centered, in the accent color, as in the reference decks.
 *
 * Fields: `title` (the section's name).
 */
export default function SectionCard({ slide }) {
  return (
    <div className="section-card">
      <h2 className="section-card-title"><Text>{slide.title}</Text></h2>
    </div>
  );
}
