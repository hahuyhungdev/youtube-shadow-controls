const assert = require('node:assert/strict');
const test = require('node:test');

const { DEFAULT_SETTINGS, normalizeSettings } = require('../src/settings.js');

test('settings use shadowing-friendly defaults', () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    enabled: true,
    seekSeconds: 3,
    replaySeconds: 3,
    speedStep: 0.05,
    loopRestSeconds: 0,
    toastEnabled: true,
    toastDurationMs: 850,
    toastSize: 'compact',
    toastPosition: 'top'
  });
});

test('numeric settings are clamped and invalid choices use defaults', () => {
  const settings = normalizeSettings({
    seekSeconds: 99,
    replaySeconds: -2,
    speedStep: 0.17,
    loopRestSeconds: 8,
    toastDurationMs: 10,
    toastSize: 'huge',
    toastPosition: 'left'
  });

  assert.equal(settings.seekSeconds, 10);
  assert.equal(settings.replaySeconds, 1);
  assert.equal(settings.speedStep, 0.05);
  assert.equal(settings.loopRestSeconds, 3);
  assert.equal(settings.toastDurationMs, 400);
  assert.equal(settings.toastSize, 'compact');
  assert.equal(settings.toastPosition, 'top');
});

test('settings store loads, saves, and broadcasts sync changes', async () => {
  let savedSettings = null;
  let storageListener = null;
  const chromeApi = {
    storage: {
      sync: {
        async get(defaults) { return { ...defaults, seekSeconds: 5 }; },
        async set(settings) { savedSettings = settings; }
      },
      onChanged: {
        addListener(listener) { storageListener = listener; }
      }
    }
  };
  const { createSettingsStore } = require('../src/settings.js');
  const store = createSettingsStore(chromeApi);
  const updates = [];
  const unsubscribe = store.subscribe((settings) => updates.push(settings));

  assert.equal((await store.load()).seekSeconds, 5);
  assert.equal((await store.save({ replaySeconds: 7 })).replaySeconds, 7);
  assert.equal(savedSettings.replaySeconds, 7);

  storageListener({ seekSeconds: { newValue: 2 } }, 'sync');
  assert.equal(store.get().seekSeconds, 2);
  assert.equal(updates.at(-1).seekSeconds, 2);

  unsubscribe();
});

test('settings store works without browser storage', async () => {
  const { createSettingsStore } = require('../src/settings.js');
  const store = createSettingsStore(null);

  assert.deepEqual(await store.load(), DEFAULT_SETTINGS);
  assert.equal((await store.save({ seekSeconds: 6 })).seekSeconds, 6);
});
