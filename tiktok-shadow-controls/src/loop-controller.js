(function defineLoopController(globalScope) {
  function createLoopController(video, options = {}) {
    let start = null;
    let end = null;
    let enabled = false;
    let restSeconds = options.restSeconds || 0;
    let restTimer = null;

    function getState() {
      return { start, end, enabled };
    }

    function setStart() {
      start = video.currentTime;
      if (end !== null && end <= start) end = null;
      enabled = false;
      return { ok: true, time: start };
    }

    function setEnd() {
      if (start === null) return { ok: false, reason: 'start-missing' };
      if (video.currentTime <= start) return { ok: false, reason: 'end-before-start' };
      end = video.currentTime;
      enabled = true;
      return { ok: true, time: end };
    }

    function toggle() {
      if (start === null || end === null) return { ok: false, reason: 'loop-incomplete' };
      enabled = !enabled;
      return { ok: true, enabled };
    }

    function clear() {
      if (restTimer) clearTimeout(restTimer);
      restTimer = null;
      start = null;
      end = null;
      enabled = false;
      return getState();
    }

    function setRestSeconds(value) {
      restSeconds = value;
    }

    function restartLoop() {
      video.currentTime = start;
      Promise.resolve(video.play()).catch(() => {});
    }

    function handleTimeUpdate() {
      if (!enabled || start === null || end === null || video.currentTime < end) return;
      if (restSeconds <= 0) {
        restartLoop();
        return;
      }
      video.pause?.();
      if (restTimer) clearTimeout(restTimer);
      restTimer = setTimeout(restartLoop, restSeconds * 1000);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);

    function destroy() {
      if (restTimer) clearTimeout(restTimer);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    }

    return { setStart, setEnd, toggle, clear, setRestSeconds, getState, destroy };
  }

  const api = { createLoopController };
  globalScope.TTShadow = { ...(globalScope.TTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
