(function defineShortcuts(globalScope) {
  const TYPING_ELEMENTS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

  function isTypingTarget(target) {
    if (!target) return false;
    return TYPING_ELEMENTS.has(target.tagName) || Boolean(target.isContentEditable);
  }

  function getShortcutAction(event) {
    if (event.ctrlKey || event.altKey || event.metaKey) return null;

    if (event.shiftKey) {
      if (event.key === 'ArrowLeft') return 'speed-down';
      if (event.key === 'ArrowRight') return 'speed-up';
      if (event.key === '\\' || event.code === 'Backslash') return 'clear-loop';
      return null;
    }

    const actions = {
      ArrowLeft: 'seek-backward',
      ArrowRight: 'seek-forward',
      ArrowDown: 'toggle-playback',
      ArrowUp: 'replay',
      '[': 'set-loop-start',
      ']': 'set-loop-end',
      '\\': 'toggle-loop'
    };

    return actions[event.key] || null;
  }

  const api = { isTypingTarget, getShortcutAction };
  globalScope.TTShadow = { ...(globalScope.TTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
