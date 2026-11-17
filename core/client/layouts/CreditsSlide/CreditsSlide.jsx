import SlideTitle from '../../stage/SlideTitle.jsx';
import Text from '../../stage/Text.jsx';
import './CreditsSlide.css';

/** "Doe et al." and "Roe" both end with exactly one period. */
function sentence(text) {
  return text.endsWith('.') ? text : `${text}.`;
}

/**
 * Every source the presentation cites, generated from the slides' `credits`
 * and `sources.json`, in the order the talk first uses them. Fields:
 * `title`, `subtitle`?.
 */
export default function CreditsSlide({ slide, citations }) {
  return (
    <div className="slide--credits">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <ol className="credits-list">
        {citations.map((citation) => (
          <li key={citation.key} className="credits-item">
            <span className="credits-authors"><Text>{sentence(citation.authors)}</Text></span>
            {' '}
            {citation.title && <span className="credits-title"><Text>{sentence(citation.title)}</Text></span>}
            {' '}
            <span className="credits-venue">{[citation.venue, citation.year].filter(Boolean).join(' ')}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
