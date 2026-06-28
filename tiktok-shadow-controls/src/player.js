(function definePlayer(globalScope) {
  function clampTime(video, time) {
    const end = Number.isFinite(video.duration) ? video.duration : Infinity;
    return Math.min(end, Math.max(0, time));
  }

  function createPlayerController(video) {
    video.preservesPitch = true;

    function seekBy(seconds) {
      video.currentTime = clampTime(video, video.currentTime + seconds);
      return video.currentTime;
    }

    async function play() {
      try {
        await video.play();
        return true;
      } catch {
        return false;
      }
    }

    function pause() {
      video.pause();
      return true;
    }

    async function togglePlayback() {
      if (video.paused) return { playing: await play() };
      pause();
      return { playing: false };
    }

    async function replay(seconds) {
      const time = seekBy(-seconds);
      await play();
      return time;
    }

    function changeSpeed(delta) {
      const nextRate = Math.min(1.5, Math.max(0.5, video.playbackRate + delta));
      video.playbackRate = Math.round(nextRate * 100) / 100;
      video.preservesPitch = true;
      return video.playbackRate;
    }

    return { seekBy, play, pause, togglePlayback, replay, changeSpeed };
  }

  const api = { createPlayerController };
  globalScope.TTShadow = { ...(globalScope.TTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
