# Phase 2 Plan: YouTube Shadowing Assistant

## Product Direction

Turn the extension from three custom shortcuts into a lightweight, keyboard-first shadowing assistant for language learners.

The extension should help a learner repeatedly listen, pause, imitate, and resume without taking focus away from the video. It should feel native to YouTube, remain fast, and avoid covering subtitles.

## Primary User Journey

As a language learner, I want to control short sections of a YouTube video without reaching for the mouse, so I can focus on listening and speaking practice.

Typical loop:

1. Play a video with subtitles.
2. Hear a phrase.
3. Pause with `Down Arrow`.
4. Speak the phrase aloud.
5. Rewind a few seconds with `Left Arrow` or replay the phrase.
6. Resume with `Down Arrow`.
7. Repeat a difficult section until it is comfortable.

## Design Principles

- Keyboard first: every frequent action must work without opening a menu.
- Quiet feedback: show confirmation without interrupting practice.
- Subtitle safe: overlays must not cover YouTube captions or important controls.
- Configurable: seek distance, replay distance, playback speed, and shortcuts should adapt to different learners.
- Native feeling: dark, high-contrast visuals that fit YouTube without copying its controls.
- Minimal permissions: keep all settings local and request no browsing-history permission.
- Accessible: clear focus states, sufficient contrast, reduced-motion support, and screen-reader labels.

## Phase 2A: Action Toasts and Feedback

### Toast behavior

Add a compact toast near the upper-center of the video, away from subtitles and the bottom control bar.

Toast examples:

- `Back 3s`
- `Forward 3s`
- `Paused`
- `Playing`
- `Speed 0.85x`
- `Loop started`
- `Loop cleared`

Interaction rules:

- Display for 700-900 ms, then fade out.
- Reuse one toast element instead of stacking messages.
- Rapid repeated seeks update the value, such as `Back 9s`, and restart the timer.
- Use an icon, short label, and optional value. Do not use sentences.
- Do not capture pointer events.
- Respect `prefers-reduced-motion` by removing scale and slide animation.
- Use an `aria-live="polite"` status region for non-visual feedback.
- Hide feedback while the user is typing.

### Technical structure

- Add `src/shortcuts.js` for key-to-action logic.
- Add `src/toast.js` for rendering and timing.
- Add `src/content.js` as the browser integration layer.
- Mount UI inside a Shadow DOM root so YouTube styles cannot break it.
- Keep pure action logic independently testable with Node's built-in test runner.

### Acceptance criteria

- Every handled shortcut produces the correct toast.
- Toasts never cover the normal subtitle region.
- Repeated keys do not create duplicate DOM nodes or overlapping timers.
- Native YouTube 5-second seeking does not also execute.
- Toasts work after YouTube's client-side navigation changes videos.

## Phase 2B: Shadowing Controls

### Recommended default shortcuts

| Action | Default shortcut | Purpose |
|---|---|---|
| Rewind | `Left Arrow` | Go back by the configured seek amount |
| Forward | `Right Arrow` | Go forward by the configured seek amount |
| Pause / resume | `Down Arrow` | Stop to speak, then continue |
| Replay phrase | `Up Arrow` | Rewind by the replay amount and immediately play |
| Slower | `Shift + Left Arrow` | Reduce speed by 0.05x |
| Faster | `Shift + Right Arrow` | Increase speed by 0.05x |
| Set loop start | `[` | Mark the beginning of a difficult phrase |
| Set loop end | `]` | Mark the end and begin repeating |
| Toggle loop | `\` | Enable or disable the saved loop |
| Clear loop | `Shift + \` | Remove both loop markers |

Defaults:

- Seek amount: 3 seconds.
- Replay amount: 3 seconds.
- Speed range: 0.5x to 1.5x.
- Speed step: 0.05x.
- Preserve pitch while changing speed.
- Loop rest delay: off by default; configurable from 0 to 3 seconds.

### Replay phrase

`Up Arrow` should be the fastest shadowing action. It rewinds by the configured replay amount and starts playback, even when the video is paused.

This differs from `Left Arrow`, which only changes position and preserves the current paused/playing state.

### A-B loop

- `[` stores the current timestamp as point A.
- `]` stores point B and starts the loop if B is after A.
- At B, playback returns to A.
- Show A and B markers in a small temporary status toast.
- Clear markers when the video changes, unless session persistence is explicitly enabled later.
- Handle invalid marker order with a helpful toast instead of silently failing.

### Acceptance criteria

- Replay begins from the correct bounded timestamp.
- Speed changes are clamped and reflected in the toast.
- A-B looping remains accurate during normal playback and manual seeking.
- Shortcuts do not run in inputs, text areas, editable elements, or when modifier combinations are unrelated.
- Holding a key produces controlled repeat behavior without flooding the UI.

## Phase 2C: Extension Popup and Settings

Create a compact extension popup for configuration, not for frequent playback controls.

### Popup sections

1. **Status**
   - Extension enabled toggle.
   - Current tab connection state.
   - Current video speed and active loop state.

2. **Practice**
   - Seek amount: 1-10 seconds.
   - Replay amount: 1-15 seconds.
   - Speed step: 0.05x, 0.1x, or 0.25x.
   - Optional loop rest delay.

3. **Feedback**
   - Toasts enabled.
   - Toast size: compact or large.
   - Toast duration.
   - Position: top center, center, or bottom center with subtitle-safe offset.

4. **Shortcuts**
   - Readable shortcut reference.
   - Conflict warning.
   - Reset defaults.
   - Custom key binding in a later 2C iteration if browser-level command limitations make the first implementation too complex.

### Popup visual direction

- A focused practice-tool aesthetic: near-black background, warm off-white text, and a single amber accent inspired by playback progress.
- Strong numeric typography for seconds and playback speed.
- Compact 8px spacing rhythm, 12px corners, and restrained shadows.
- No decorative gradients, glass effects, or unnecessary animation.
- Minimum 44px interactive targets and visible keyboard focus rings.
- Width around 340px, with no scrolling in the default state.

### Storage

- Use `chrome.storage.sync` for user preferences when available.
- Fall back to local defaults if storage cannot be read.
- Validate and clamp every stored numeric value before use.
- Do not store video history, subtitle text, or browsing activity.

## Phase 2D: Optional Practice Panel

Only build this after the keyboard workflow is proven useful.

Add a collapsible panel attached to the right side of the player with:

- Current practice segment A-B timestamps.
- Repeat count for the current segment.
- Large replay, pause, and loop buttons.
- Session counters: practiced minutes and repetitions.
- A temporary text note for the current phrase.

The panel must default to closed, remember its open state, and never resize or obscure the video on small screens.

Do not add automatic speech scoring, subtitle scraping, cloud accounts, AI feedback, or persistent study history in Phase 2. Those features add privacy, accuracy, and product-complexity risks before the core practice loop is validated.

## Architecture Plan

```text
youtube-shortcut-control/
├── manifest.json
├── src/
│   ├── content.js
│   ├── player.js
│   ├── shortcuts.js
│   ├── settings.js
│   ├── loop-controller.js
│   └── ui/
│       ├── toast.js
│       └── toast.css
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── test/
│   ├── shortcuts.test.js
│   ├── player.test.js
│   ├── loop-controller.test.js
│   ├── settings.test.js
│   └── toast.test.js
└── README.md
```

Responsibilities:

- `shortcuts.js`: translate keyboard events into named actions.
- `player.js`: seek, play, pause, and change speed safely.
- `loop-controller.js`: own A-B loop state and boundary behavior.
- `settings.js`: defaults, storage, validation, and change subscriptions.
- `toast.js`: render accessible feedback without knowing player logic.
- `content.js`: connect YouTube's current video element to the modules.

## Test and Verification Plan

### Unit tests

- Every shortcut mapping and ignored-input case.
- Seek and replay boundary clamping.
- Pause/resume behavior and rejected `play()` promises.
- Speed range and step behavior.
- Valid and invalid A-B marker states.
- Setting validation and defaults.
- Toast replacement, timeout cleanup, aggregation, and reduced motion.

### Integration tests

- Content script finds a video after page load and YouTube navigation.
- One key press triggers one player action and one toast.
- Settings changes apply without refreshing the tab.
- Loop state resets correctly when the active video changes.

### Browser verification

- Chrome and Microsoft Edge.
- Standard videos, Shorts, theater mode, full screen, and picture-in-picture behavior.
- Captions on and off at multiple sizes.
- Search box, comments, live chat, and other typing surfaces.
- Light and dark YouTube themes.
- Keyboard auto-repeat and rapid alternating shortcuts.

## Delivery Order

1. Refactor current behavior into testable modules without changing shortcuts.
2. Add toast tests and implement the accessible Shadow DOM toast.
3. Add replay phrase and playback-speed controls.
4. Add A-B loop behavior and tests.
5. Add settings storage and migration from fixed defaults.
6. Build and visually verify the popup.
7. Run browser QA across normal videos, Shorts, captions, and full screen.
8. Update installation, shortcut, privacy, and troubleshooting documentation.

Each step should be independently releasable and keep the existing three shortcuts working.

## Success Metrics

- A learner can complete the listen-pause-speak-replay loop without using the mouse.
- Frequent actions require one key press.
- Visual feedback appears in under 100 ms and never obscures subtitles.
- No duplicate actions from YouTube's native shortcuts.
- No errors across client-side video navigation.
- At least 80% automated coverage for pure logic modules.
- A 15-minute practice session can be completed without opening the popup after initial setup.

## Recommended Phase 2 Scope

Build 2A, 2B, and 2C. Treat 2D as a separate follow-up after real use confirms that visible session tracking is useful. The highest-value first release is toast feedback, replay phrase, speed control, A-B looping, and a small settings popup.
