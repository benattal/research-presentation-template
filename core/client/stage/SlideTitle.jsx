import { motion } from 'framer-motion';
import Text from './Text.jsx';

/**
 * A slide's title and its optional subtitle line, with math rendered. The
 * title names the topic; the subtitle states the slide's point
 * (docs/style/slides.md). Layouts call it instead of writing their own
 * heading, so every slide's header looks the same.
 */
export default function SlideTitle({ title, subtitle }) {
  return (
    <header className="slide-header">
      <motion.h2 className="slide-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <Text>{title}</Text>
      </motion.h2>
      {subtitle && (
        <motion.p className="slide-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <Text>{subtitle}</Text>
        </motion.p>
      )}
    </header>
  );
}
