# Audio Architecture

Key decisions:
- TV has independent audio volume
- Browser audio is unaffected (user manages browser muting themselves)
- Volume controlled via right-click context menu slider only
- No physical volume knob on the TV

## Audio Flow
```text
HTML5 <video> element → WebView2 audio output → Windows audio mixer → speakers
```

- The HTML5 video element handles audio playback natively
- Volume is controlled via `video.volume` (0.0 to 1.0)
- Mute is controlled via `video.muted`
- The TV appears as the Tauri app process in Windows Volume Mixer
- Users can also control volume via Windows Volume Mixer

## Audio States

| TV State | Audio Behavior |
|---|---|
| PLAYING (browser video) | Audio plays from TV. Browser also plays its own audio. User mutes browser if needed. |
| PLAYING (local file) | Audio plays from TV only (no browser involved). |
| STATIC | No audio (or optional subtle static hiss — future feature) |
| POWERING_ON | Optional CRT power-on sound effect (future feature) |
| POWERING_OFF | Optional CRT power-off sound effect (future feature) |
| OFF | No audio |

## Double Audio Issue
When playing a browser video, both the browser tab AND the TV will play audio simultaneously (since the TV has its own independent stream from URL extraction). The user is responsible for muting the browser tab. This is a known UX tradeoff chosen for simplicity.

Alternative (future): the extension could offer a "Mute browser tab" checkbox in the popup.
