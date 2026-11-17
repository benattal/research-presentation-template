import './DiscussionSlide.css';
import Text from '../../stage/Text.jsx';

export default function DiscussionSlide({ slide }) {
  return (
    <div className="slide--discussion">
      <h2><Text>{slide.title}</Text></h2>

      <div className="discussion-prompts">
        {slide.prompts.map((prompt, i) => (
          <div key={i} className="discussion-prompt">
            <span className="prompt-number">{i + 1}</span>
            <Text>{prompt}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
