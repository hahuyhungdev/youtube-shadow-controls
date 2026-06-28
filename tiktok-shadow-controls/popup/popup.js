(async function initializePopup() {
  const { DEFAULT_SETTINGS, createSettingsStore } = globalThis.TTShadow;
  const store = createSettingsStore();
  const form = document.querySelector('#settings-form');
  const status = document.querySelector('#save-status');
  const durationOutput = document.querySelector('#duration-output');
  const fieldIds = Object.keys(DEFAULT_SETTINGS);
  let saveTimer = null;

  function render(settings) {
    fieldIds.forEach((id) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = settings[id];
      else field.value = String(settings[id]);
    });
    durationOutput.value = `${(settings.toastDurationMs / 1000).toFixed(2)}s`;
  }

  function readForm() {
    return {
      enabled: document.querySelector('#enabled').checked,
      seekSeconds: Number(document.querySelector('#seekSeconds').value),
      replaySeconds: Number(document.querySelector('#replaySeconds').value),
      speedStep: Number(document.querySelector('#speedStep').value),
      loopRestSeconds: Number(document.querySelector('#loopRestSeconds').value),
      toastEnabled: document.querySelector('#toastEnabled').checked,
      toastDurationMs: Number(document.querySelector('#toastDurationMs').value),
      toastSize: document.querySelector('#toastSize').value,
      toastPosition: document.querySelector('#toastPosition').value
    };
  }

  async function save() {
    const settings = await store.save(readForm());
    render(settings);
    status.textContent = 'Saved';
    status.classList.add('saved');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      status.textContent = 'Ready';
      status.classList.remove('saved');
    }, 900);
  }

  form.addEventListener('input', () => {
    durationOutput.value = `${(Number(document.querySelector('#toastDurationMs').value) / 1000).toFixed(2)}s`;
    save();
  });
  document.querySelector('#reset-button').addEventListener('click', async () => {
    const settings = await store.save(DEFAULT_SETTINGS);
    render(settings);
    status.textContent = 'Defaults restored';
    status.classList.add('saved');
  });

  render(await store.load());
})();
