const assert = require('node:assert/strict');
const test = require('node:test');

const { getShortcutAction, isTypingTarget } = require('../src/shortcuts.js');

function keyEvent(key, overrides = {}) {
  return { key, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, ...overrides };
}

test('maps the Phase 2 keyboard controls', () => {
  assert.equal(getShortcutAction(keyEvent('ArrowLeft')), 'seek-backward');
  assert.equal(getShortcutAction(keyEvent('ArrowRight')), 'seek-forward');
  assert.equal(getShortcutAction(keyEvent('ArrowDown')), 'toggle-playback');
  assert.equal(getShortcutAction(keyEvent('ArrowUp')), 'replay');
  assert.equal(getShortcutAction(keyEvent('ArrowLeft', { shiftKey: true })), 'speed-down');
  assert.equal(getShortcutAction(keyEvent('ArrowRight', { shiftKey: true })), 'speed-up');
  assert.equal(getShortcutAction(keyEvent('[')), 'set-loop-start');
  assert.equal(getShortcutAction(keyEvent(']')), 'set-loop-end');
  assert.equal(getShortcutAction(keyEvent('\\')), 'toggle-loop');
  assert.equal(getShortcutAction(keyEvent('\\', { shiftKey: true })), 'clear-loop');
});

test('ignores unrelated modifier combinations', () => {
  assert.equal(getShortcutAction(keyEvent('ArrowLeft', { ctrlKey: true })), null);
  assert.equal(getShortcutAction(keyEvent('ArrowDown', { altKey: true })), null);
});

test('detects typing and editable targets', () => {
  assert.equal(isTypingTarget({ tagName: 'INPUT', isContentEditable: false }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: false }), false);
});

