# TikTok Shadow Controls

A keyboard-first Chrome and Microsoft Edge extension for language shadowing practice on TikTok.

This extension is specifically designed to handle TikTok's infinite scrolling video feed by automatically detecting the active playing or centered video in your viewport.

## Controls

| Shortcut | Action |
|---|---|
| `Left Arrow` | Rewind by the configured seek amount |
| `Right Arrow` | Move forward by the configured seek amount |
| `Down Arrow` | Pause or resume |
| `Up Arrow` | Rewind by the replay amount and play |
| `Shift + Left Arrow` | Reduce playback speed |
| `Shift + Right Arrow` | Increase playback speed |
| `[` | Set loop point A |
| `]` | Set loop point B and begin looping |
| `\` | Turn the A-B loop on or off |
| `Shift + \` | Clear the loop |

Every action can show a short notification over the upper part of the video. The notification position, size, and duration are configurable from the extension popup.

Shortcuts are disabled while typing in comments, search inputs, text areas, select menus, or editable text.

## Settings

Click the extension icon to configure:

- Enable or disable the extension.
- Seek and replay duration.
- Playback-speed step.
- Pause duration between loop repetitions.
- Notification visibility, size, position, and duration.

Preferences are stored with `chrome.storage.sync`. The extension does not store video history, captions, or browsing activity.

## Install

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `tiktok-shortcut-control` folder.
5. Reload any open TikTok tabs after installing or updating.

After changing extension files, click the reload button on the extension card and refresh TikTok.

## Tests

```bash
npm test
npm run test:coverage
```
