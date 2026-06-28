(function defineContent(globalScope) {
  function loopErrorMessage(reason) {
    if (reason === 'start-missing') return 'Set loop A first';
    if (reason === 'end-before-start') return 'Loop B must be later';
    return 'Set loop A and B first';
  }

  async function executeAction(action, dependencies) {
    const { player, loop, settings, toast } = dependencies;

    if (action === 'seek-backward' || action === 'seek-forward') {
      const seconds = settings.seekSeconds * (action === 'seek-backward' ? -1 : 1);
      player.seekBy(seconds);
      toast.show({ type: 'seek', seconds });
      return;
    }

    if (action === 'toggle-playback') {
      const result = await player.togglePlayback();
      toast.show({ type: result.playing ? 'playing' : 'paused' });
      return;
    }

    if (action === 'replay') {
      await player.replay(settings.replaySeconds);
      toast.show({ type: 'replay', seconds: settings.replaySeconds });
      return;
    }

    if (action === 'speed-down' || action === 'speed-up') {
      const direction = action === 'speed-down' ? -1 : 1;
      const rate = player.changeSpeed(settings.speedStep * direction);
      toast.show({ type: 'speed', rate });
      return;
    }

    if (action === 'set-loop-start' || action === 'set-loop-end') {
      const result = action === 'set-loop-start' ? loop.setStart() : loop.setEnd();
      if (!result.ok) {
        toast.show({ type: 'loop-error', message: loopErrorMessage(result.reason) });
        return;
      }
      toast.show({ type: action === 'set-loop-start' ? 'loop-start' : 'loop-end', time: result.time });
      return;
    }

    if (action === 'toggle-loop') {
      const result = loop.toggle();
      if (!result.ok) {
        toast.show({ type: 'loop-error', message: loopErrorMessage(result.reason) });
        return;
      }
      toast.show({ type: result.enabled ? 'loop-on' : 'loop-off' });
      return;
    }

    if (action === 'clear-loop') {
      loop.clear();
      toast.show({ type: 'loop-clear' });
    }
  }

  async function initialize() {
    const api = globalScope.YTShadow;
    const settingsStore = api.createSettingsStore();
    let settings = await settingsStore.load();
    const toast = api.createToast(document, settings);
    let activeVideo = null;
    let player = null;
    let loop = null;

    function bindVideo() {
      const video = document.querySelector('video');
      if (!video) return false;
      if (video === activeVideo) return true;

      loop?.destroy();
      activeVideo = video;
      player = api.createPlayerController(video);
      loop = api.createLoopController(video, { restSeconds: settings.loopRestSeconds });
      return true;
    }

    function resetVideo() {
      loop?.destroy();
      activeVideo = null;
      player = null;
      loop = null;
    }

    settingsStore.subscribe((nextSettings) => {
      settings = nextSettings;
      toast.updateSettings(settings);
      loop?.setRestSeconds(settings.loopRestSeconds);
    });

    document.addEventListener('yt-navigate-start', resetVideo);
    document.addEventListener('keydown', async (event) => {
      if (!settings.enabled || api.isTypingTarget(event.target)) return;
      const action = api.getShortcutAction(event);
      if (!action || !bindVideo()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      await executeAction(action, { player, loop, settings, toast });
    }, true);
  }

  const api = { executeAction, initialize };
  globalScope.YTShadow = { ...(globalScope.YTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') initialize();
})(typeof globalThis !== 'undefined' ? globalThis : window);
