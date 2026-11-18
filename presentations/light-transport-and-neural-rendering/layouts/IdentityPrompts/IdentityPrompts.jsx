import SlideTitle from '@core/stage/SlideTitle.jsx';
import EquationStack from '@core/stage/EquationStack.jsx';
import './IdentityPrompts.css';

/**
 * Identities asked of the class one at a time: `lines`, an EquationStack
 * whose lines each have a `rhs`, appear at their `step` with a question
 * mark over the relation, and their right side follows on the next build
 * step. Content fields: `title`, `subtitle`, `lines`, and `buildSteps`
 * (one per step; the stack's last right side shows on the last).
 */
export default function IdentityPrompts({ slide, buildStep }) {
  if (!Array.isArray(slide.lines) || slide.lines.length === 0) {
    throw new Error(`identityPrompts: slide "${slide.id}" needs "lines"`);
  }
  return (
    <div className="slide--identity-prompts">
      <SlideTitle title={slide.title} subtitle={slide.subtitle} />
      <EquationStack lines={slide.lines} step={buildStep} className="identity-prompts-lines" />
    </div>
  );
}
