# Acceptance Criteria

Every requirement must have a testable acceptance criterion.

| ID | Requirement | Acceptance Criterion |
|---|---|---|
| AC-001 | YouTube video extraction | When a YouTube video is playing in Chrome, clicking the extension → selecting the video → video begins playing in the TV within 5 seconds |
| AC-002 | HTML5 video extraction | When a standard HTML5 video is playing, clicking the extension → selecting the video → video begins playing in the TV within 3 seconds |
| AC-003 | Local file playback (drag-drop) | Dragging an .mp4 file from File Explorer onto the TV window starts video playback within 2 seconds |
| AC-004 | Local file playback (file picker) | Right-click → Open File → selecting an .mp4 → video starts playing within 2 seconds |
| AC-005 | Frameless transparent window | TV window has no title bar, no Windows chrome. Transparent areas around the TV shape are click-through. |
| AC-006 | Move window | Clicking and dragging the TV body moves the window. The window follows the cursor smoothly. |
| AC-007 | Resize window | Dragging any edge or corner resizes the TV proportionally (aspect ratio locked). |
| AC-008 | Always-on-top | With always-on-top enabled, the TV stays above all other windows including fullscreen applications (where possible). |
| AC-009 | Always-on-top toggle | Toggling always-on-top in the right-click menu changes the TV's z-order behavior immediately. |
| AC-010 | CRT power-on animation | When a video is first received, a bright horizontal line appears, expands to full screen, brief static, then video. Total animation < 600ms. |
| AC-011 | CRT power-off animation | Clicking the power button shrinks the video to a line, then a dot, then black. App exits after animation. Total < 700ms. |
| AC-012 | CRT intensity knob | Clicking and dragging the top knob smoothly adjusts CRT effect intensity from 0% (clean) to 100% (full retro). A value indicator is visible during adjustment. |
| AC-013 | CRT color temperature knob | Clicking and dragging the bottom knob shifts color temperature from warm amber to cool blue. |
| AC-014 | CRT effects toggleable | Each CRT effect (scanlines, curvature, vignette, chromatic aberration, glow, noise) can be individually toggled on/off via right-click → CRT Effects submenu. |
| AC-015 | TV static on signal loss | When the video stream ends or the source is lost, the TV screen transitions to animated static/snow within 1 second. |
| AC-016 | Independent playback | After extracting a YouTube video, closing the source browser tab does not stop playback in the TV. |
| AC-017 | Play/pause sync | While the source tab is open, pausing the video in the browser causes the TV to pause within 500ms. |
| AC-018 | Single instance | Sending a second video to the TV replaces the first. Only one TV window exists at a time. |
| AC-019 | Right-click context menu | Right-clicking anywhere on the TV body opens a context menu with: Always on top, Volume, CRT Effects, Open File, About, Quit. |
| AC-020 | Volume control | The volume slider in the right-click menu adjusts TV audio volume from 0% to 100%. |
| AC-021 | Multi-monitor | The TV can be dragged to any connected monitor and displays correctly with proper DPI scaling. |
| AC-022 | No data collection | The app makes no network calls except to fetch the video stream. No data is logged, stored, or transmitted. |
| AC-023 | Extension compatibility | The extension loads and works correctly in Chrome, Edge, and Brave (latest versions). |
| AC-024 | Auto-launch | If the Tauri app is not running, clicking the extension and selecting a video launches the app automatically. |
| AC-025 | Local file controls | When playing a local file, clicking the screen toggles play/pause. A seek bar appears on hover. |
