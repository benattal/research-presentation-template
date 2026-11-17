import { useEffect } from 'react';

const KEY_ACTIONS = {
  ArrowRight: 'next',
  ArrowDown: 'next',
  PageDown: 'next',
  ' ': 'next',
  Enter: 'next',
  ArrowLeft: 'previous',
  ArrowUp: 'previous',
  PageUp: 'previous',
  Backspace: 'previous',
  o: 'toggleOverview',
  O: 'toggleOverview',
  Escape: 'closeOverview',
  f: 'toggleFullscreen',
  F: 'toggleFullscreen',
  p: 'openPresenterWindow',
  P: 'openPresenterWindow',
  c: 'resetPoll',
  C: 'resetPoll',
};

/** Input types that consume typed characters and arrow keys as text editing. */
const TEXT_INPUT_TYPES = new Set(['text', 'number', 'search', 'email', 'password', 'url', 'tel']);

function isTyping(target) {
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true;
  return target.tagName === 'INPUT' && TEXT_INPUT_TYPES.has(target.type);
}

/**
 * Bind the presentation keys to `actions`, an object whose keys are the
 * action names in `KEY_ACTIONS`. A key whose action is absent from `actions`
 * keeps its browser behavior. Keys typed into text fields and key chords
 * with Ctrl, Alt or Meta are never intercepted. Other focused controls
 * (sliders, buttons) do not block navigation: a presenter's clicker sends
 * arrow keys, and a slider left focused after a drag must not swallow them.
 */
export default function useKeyboardNavigation(actions) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const action = actions[KEY_ACTIONS[event.key]];
      if (!action) return;
      event.preventDefault();
      action();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
