import Text from './Text.jsx';

/**
 * A slide's title and its optional subtitle line, with math rendered. The
 * title names the topic; the subtitle states the slide's point
 * (docs/style/slides.md). Layouts call it instead of writing their own
 * heading, so every slide's header looks the same.
 *
 * The header does not animate: it appears with its slide, through the
 * slide transition, and stays put while the slide's build steps play.
 */
export default function SlideTitle({ title, subtitle }) {
  return (
    <header className="slide-header">
      <h2 className="slide-title"><Text>{title}</Text></h2>
      {subtitle && <p className="slide-subtitle"><Text>{subtitle}</Text></p>}
    </header>
  );
}
