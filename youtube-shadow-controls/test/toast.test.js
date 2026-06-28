const assert = require('node:assert/strict');
const test = require('node:test');

const { createToastModel } = require('../src/ui/toast.js');

test('repeated seeks aggregate into one concise message', () => {
  const toast = createToastModel();

  assert.equal(toast.next({ type: 'seek', seconds: -3 }, 1000).label, 'Back 3s');
  assert.equal(toast.next({ type: 'seek', seconds: -3 }, 1200).label, 'Back 6s');
  assert.equal(toast.next({ type: 'seek', seconds: 3 }, 1300).label, 'Forward 3s');
});

test('non-seek actions replace the current message', () => {
  const toast = createToastModel();

  assert.equal(toast.next({ type: 'paused' }, 1000).label, 'Paused');
  assert.equal(toast.next({ type: 'speed', rate: 0.85 }, 1100).label, 'Speed 0.85x');
  assert.equal(toast.next({ type: 'loop-start', time: 65.2 }, 1200).label, 'Loop A 1:05');
});
