(function defineSettings(globalScope) {
  const DEFAULT_SETTINGS = Object.freeze({
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

  const SPEED_STEPS = [0.05, 0.1, 0.25];
  const TOAST_SIZES = ['compact', 'large'];
  const TOAST_POSITIONS = ['top', 'center', 'bottom'];

  function clampNumber(value, minimum, maximum, fallback) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    return Math.min(maximum, Math.max(minimum, numericValue));
  }

  function normalizeSettings(input = {}) {
    return {
      enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_SETTINGS.enabled,
      seekSeconds: clampNumber(input.seekSeconds, 1, 10, DEFAULT_SETTINGS.seekSeconds),
      replaySeconds: clampNumber(input.replaySeconds, 1, 15, DEFAULT_SETTINGS.replaySeconds),
      speedStep: SPEED_STEPS.includes(Number(input.speedStep))
        ? Number(input.speedStep)
        : DEFAULT_SETTINGS.speedStep,
      loopRestSeconds: clampNumber(input.loopRestSeconds, 0, 3, DEFAULT_SETTINGS.loopRestSeconds),
      toastEnabled: typeof input.toastEnabled === 'boolean'
        ? input.toastEnabled
        : DEFAULT_SETTINGS.toastEnabled,
      toastDurationMs: clampNumber(input.toastDurationMs, 400, 2000, DEFAULT_SETTINGS.toastDurationMs),
      toastSize: TOAST_SIZES.includes(input.toastSize) ? input.toastSize : DEFAULT_SETTINGS.toastSize,
      toastPosition: TOAST_POSITIONS.includes(input.toastPosition)
        ? input.toastPosition
        : DEFAULT_SETTINGS.toastPosition
    };
  }

  function createSettingsStore(chromeApi = globalScope.chrome) {
    let currentSettings = { ...DEFAULT_SETTINGS };
    const listeners = new Set();

    async function load() {
      if (!chromeApi?.storage?.sync) return currentSettings;
      const stored = await chromeApi.storage.sync.get(DEFAULT_SETTINGS);
      currentSettings = normalizeSettings(stored);
      return currentSettings;
    }

    async function save(partialSettings) {
      currentSettings = normalizeSettings({ ...currentSettings, ...partialSettings });
      if (chromeApi?.storage?.sync) await chromeApi.storage.sync.set(currentSettings);
      listeners.forEach((listener) => listener(currentSettings));
      return currentSettings;
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    chromeApi?.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;
      const changedValues = Object.fromEntries(
        Object.entries(changes).map(([key, value]) => [key, value.newValue])
      );
      currentSettings = normalizeSettings({ ...currentSettings, ...changedValues });
      listeners.forEach((listener) => listener(currentSettings));
    });

    return { load, save, subscribe, get: () => currentSettings };
  }

  const api = { DEFAULT_SETTINGS, normalizeSettings, createSettingsStore };
  globalScope.YTShadow = { ...(globalScope.YTShadow || {}), ...api };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
