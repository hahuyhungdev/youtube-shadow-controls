(function defineToast(globalScope) {
  const AGGREGATION_WINDOW_MS = 450;

  function formatTime(seconds) {
    const rounded = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(rounded / 60);
    return `${minutes}:${String(rounded % 60).padStart(2, '0')}`;
  }

  function actionLabel(action) {
    const labels = {
      paused: 'Paused',
      playing: 'Playing',
      replay: `Replay ${action.seconds}s`,
      'loop-on': 'Loop on',
      'loop-off': 'Loop off',
      'loop-clear': 'Loop cleared',
      'loop-error': action.message || 'Set loop A first'
    };
    if (action.type === 'speed') return `Speed ${action.rate}x`;
    if (action.type === 'loop-start') return `Loop A ${formatTime(action.time)}`;
    if (action.type === 'loop-end') return `Loop B ${formatTime(action.time)}`;
    return labels[action.type] || '';
  }

  function createToastModel() {
    let previous = null;

    function next(action, now = Date.now()) {
      if (action.type === 'seek') {
        const canAggregate = previous?.type === 'seek'
          && Math.sign(previous.seconds) === Math.sign(action.seconds)
          && now - previous.time <= AGGREGATION_WINDOW_MS;
        const seconds = canAggregate ? previous.seconds + action.seconds : action.seconds;
        previous = { type: 'seek', seconds, time: now };
        return { label: `${seconds < 0 ? 'Back' : 'Forward'} ${Math.abs(seconds)}s` };
      }

      previous = { type: action.type, time: now };
      return { label: actionLabel(action) };
    }

    return { next };
  }

  function createToast(documentObject, initialSettings) {
    const model = createToastModel();
    const host = documentObject.createElement('div');
    host.id = 'yt-shadow-toast-host';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = documentObject.createElement('style');
    style.textContent = `
      :host { all: initial; pointer-events: none; }
      .toast {
        --accent: #ffb000;
        position: fixed;
        z-index: 2147483647;
        left: 50%;
        top: 12%;
        transform: translate(-50%, -8px) scale(.97);
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 40px;
        padding: 0 15px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 12px;
        background: rgba(17,17,17,.92);
        box-shadow: 0 12px 34px rgba(0,0,0,.4);
        color: #fff8e7;
        font: 650 14px/1.1 ui-rounded, "Avenir Next", "Segoe UI", sans-serif;
        letter-spacing: .01em;
        opacity: 0;
        transition: opacity 140ms ease, transform 180ms cubic-bezier(.2,.8,.2,1);
        backdrop-filter: blur(10px);
      }
      .toast::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 4px rgba(255,176,0,.14);
      }
      .toast.visible { opacity: 1; transform: translate(-50%, 0) scale(1); }
      .toast.large { min-height: 52px; padding: 0 20px; font-size: 17px; }
      .toast.center { top: 48%; }
      .toast.bottom { top: auto; bottom: 22%; }
      @media (prefers-reduced-motion: reduce) { .toast { transition: opacity 80ms linear; } }
    `;
    const element = documentObject.createElement('div');
    element.className = 'toast';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    shadow.append(style, element);
    (documentObject.documentElement || documentObject.body).append(host);

    let settings = initialSettings;
    let hideTimer = null;

    function updateSettings(nextSettings) {
      settings = nextSettings;
    }

    function show(action) {
      if (!settings.toastEnabled) return;
      element.textContent = model.next(action).label;
      element.className = `toast ${settings.toastSize} ${settings.toastPosition}`;
      void element.offsetWidth;
      element.classList.add('visible');
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => element.classList.remove('visible'), settings.toastDurationMs);
    }

    function destroy() {
      if (hideTimer) clearTimeout(hideTimer);
      host.remove();
    }

    return { show, updateSettings, destroy };
  }

  const api = { createToastModel, createToast, formatTime };
  globalScope.YTShadow = { ...(globalScope.YTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
