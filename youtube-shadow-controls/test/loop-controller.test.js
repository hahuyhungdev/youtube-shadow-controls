const assert = require('node:assert/strict');
const test = require('node:test');

const { createLoopController } = require('../src/loop-controller.js');

function createVideo() {
  const listeners = new Map();
  return {
    currentTime: 5,
    playCalls: 0,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    play() { this.playCalls += 1; return Promise.resolve(); },
    emit(type) { listeners.get(type)?.(); }
  };
}

test('creates and runs a valid A-B loop', () => {
  const video = createVideo();
  const loop = createLoopController(video);

  assert.deepEqual(loop.setStart(), { ok: true, time: 5 });
  video.currentTime = 8;
  assert.deepEqual(loop.setEnd(), { ok: true, time: 8 });

  video.currentTime = 8.1;
  video.emit('timeupdate');

  assert.equal(video.currentTime, 5);
  assert.equal(video.playCalls, 1);
});

test('rejects an end marker before the start marker', () => {
  const video = createVideo();
  const loop = createLoopController(video);

  loop.setStart();
  video.currentTime = 4;

  assert.deepEqual(loop.setEnd(), { ok: false, reason: 'end-before-start' });
});

test('toggle and clear expose stable loop state', () => {
  const video = createVideo();
  const loop = createLoopController(video);

  assert.deepEqual(loop.toggle(), { ok: false, reason: 'loop-incomplete' });
  loop.setStart();
  video.currentTime = 7;
  loop.setEnd();
  assert.equal(loop.toggle().enabled, false);
  assert.deepEqual(loop.clear(), { start: null, end: null, enabled: false });
});

test('setting a later start invalidates an earlier end and destroy removes the listener', () => {
  const video = createVideo();
  const loop = createLoopController(video);
  loop.setStart();
  video.currentTime = 7;
  loop.setEnd();
  video.currentTime = 8;

  loop.setStart();
  assert.deepEqual(loop.getState(), { start: 8, end: null, enabled: false });
  loop.destroy();
  video.currentTime = 10;
  video.emit('timeupdate');
  assert.equal(video.currentTime, 10);
});
