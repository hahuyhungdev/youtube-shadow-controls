const assert = require('node:assert/strict');
const test = require('node:test');

const { createPlayerController } = require('../src/player.js');

function createVideo(overrides = {}) {
  return {
    currentTime: 10,
    duration: 100,
    paused: true,
    playbackRate: 1,
    preservesPitch: false,
    playCalls: 0,
    pauseCalls: 0,
    play() {
      this.paused = false;
      this.playCalls += 1;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
      this.pauseCalls += 1;
    },
    ...overrides
  };
}

test('seek clamps to video boundaries and preserves playback state', () => {
  const video = createVideo({ currentTime: 1 });
  const player = createPlayerController(video);

  assert.equal(player.seekBy(-3), 0);
  video.currentTime = 99;
  assert.equal(player.seekBy(3), 100);
  assert.equal(video.playCalls, 0);
});

test('replay rewinds and starts playback', async () => {
  const video = createVideo({ currentTime: 2 });
  const player = createPlayerController(video);

  const time = await player.replay(3);

  assert.equal(time, 0);
  assert.equal(video.playCalls, 1);
});

test('speed changes are rounded and clamped', () => {
  const video = createVideo({ playbackRate: 1.48 });
  const player = createPlayerController(video);

  assert.equal(player.changeSpeed(0.05), 1.5);
  video.playbackRate = 0.51;
  assert.equal(player.changeSpeed(-0.05), 0.5);
  assert.equal(video.preservesPitch, true);
});

test('toggle playback pauses a playing video and resumes a paused video', async () => {
  const video = createVideo({ paused: false });
  const player = createPlayerController(video);

  assert.deepEqual(await player.togglePlayback(), { playing: false });
  assert.equal(video.pauseCalls, 1);
  assert.deepEqual(await player.togglePlayback(), { playing: true });
  assert.equal(video.playCalls, 1);
});

test('play failures are reported without throwing', async () => {
  const video = createVideo({ play: () => Promise.reject(new Error('blocked')) });
  const player = createPlayerController(video);

  assert.equal(await player.play(), false);
});
