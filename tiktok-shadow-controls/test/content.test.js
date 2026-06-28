const assert = require('node:assert/strict');
const test = require('node:test');

const { executeAction, getActiveVideo } = require('../src/content.js');

function createDependencies() {
  const calls = [];
  return {
    calls,
    player: {
      seekBy(value) { calls.push(['seek', value]); },
      togglePlayback() { calls.push(['toggle']); return Promise.resolve({ playing: false }); },
      replay(value) { calls.push(['replay', value]); return Promise.resolve(); },
      changeSpeed(value) { calls.push(['speed', value]); return 0.95; }
    },
    loop: {
      setStart() { return { ok: true, time: 12 }; },
      setEnd() { return { ok: false, reason: 'start-missing' }; },
      toggle() { return { ok: true, enabled: true }; },
      clear() { calls.push(['clear']); }
    },
    settings: { seekSeconds: 3, replaySeconds: 4, speedStep: 0.05 },
    toast: { show(action) { calls.push(['toast', action]); } }
  };
}

test('seek action changes the player and reports feedback once', async () => {
  const dependencies = createDependencies();

  await executeAction('seek-backward', dependencies);

  assert.deepEqual(dependencies.calls, [
    ['seek', -3],
    ['toast', { type: 'seek', seconds: -3 }]
  ]);
});

test('replay uses the independently configured replay amount', async () => {
  const dependencies = createDependencies();

  await executeAction('replay', dependencies);

  assert.deepEqual(dependencies.calls, [
    ['replay', 4],
    ['toast', { type: 'replay', seconds: 4 }]
  ]);
});

test('invalid loop actions produce useful feedback', async () => {
  const dependencies = createDependencies();

  await executeAction('set-loop-end', dependencies);

  assert.deepEqual(dependencies.calls, [
    ['toast', { type: 'loop-error', message: 'Set loop A first' }]
  ]);
});

test('getActiveVideo filters and selects correct video based on size and state', () => {
  const mockVideos = [
    { offsetWidth: 50, offsetHeight: 50, paused: true }, // too small
    { offsetWidth: 200, offsetHeight: 200, paused: true, ended: false, getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100 }; } },
    { offsetWidth: 200, offsetHeight: 200, paused: false, ended: false, getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100 }; } } // playing
  ];

  globalThis.document = {
    querySelectorAll(selector) {
      if (selector === 'video') return mockVideos;
      return [];
    }
  };
  globalThis.window = {
    innerWidth: 1024,
    innerHeight: 768
  };

  const active = getActiveVideo();
  assert.equal(active, mockVideos[2]); // should select the playing video

  delete globalThis.document;
  delete globalThis.window;
});
