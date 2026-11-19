import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled, so a presentation needs no network (local mode in a lecture hall).
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from './App.jsx';
import { loadPresentation } from './presentation/load.js';
import LoadErrorScreen from './presentation/LoadErrorScreen.jsx';

const root = createRoot(document.getElementById('root'));

let presentation = null;
try {
  presentation = loadPresentation();
} catch (error) {
  console.error(error);
  root.render(<LoadErrorScreen error={error} />);
}

if (presentation) {
  root.render(
    <StrictMode>
      <App presentation={presentation} />
    </StrictMode>,
  );
}
