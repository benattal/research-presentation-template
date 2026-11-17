import Text from '@core/stage/Text.jsx';

/**
 * The lightning bolt of the adjoint section's title (after "an adjoint
 * method for lightning-fast differentiable rendering"), drawn as an SVG in
 * the adjoint color so it looks the same on every machine instead of as an
 * emoji.
 */
export function Bolt() {
  return (
    <svg className="bolt" viewBox="0 0 12 20" aria-label="lightning bolt" role="img">
      <path d="M7.5 0 L0.5 11.5 H5.5 L4 20 L11.5 7.5 H6.5 Z" />
    </svg>
  );
}

/** Slide text with each "⚡" drawn as a Bolt. */
export function TextWithBolt({ children }) {
  const parts = children.split('⚡');
  return parts.map((part, i) => (
    <span key={i}>
      {part && <Text>{part}</Text>}
      {i < parts.length - 1 && <Bolt />}
    </span>
  ));
}
