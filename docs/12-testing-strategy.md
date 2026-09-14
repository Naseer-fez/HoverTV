# Testing Strategy

## Unit Tests
- **URL extraction logic**: test YouTube URL parsing, video ID extraction, stream URL selection
- **Native Messaging protocol**: test message serialization/deserialization, message validation
- **CRT shader parameters**: test uniform value mapping from knob positions to shader values
- **State machine transitions**: test all valid and invalid state transitions

Framework: Vitest (for TypeScript) + Rust's built-in test framework

## Manual Testing Checklist
| Test | Steps | Expected Result |
|---|---|---|
| YouTube video extraction | Open YouTube video → click extension → select video | Video plays in TV |
| HTML5 video extraction | Open page with `<video>` → click extension → select video | Video plays in TV |
| Local file drag-and-drop | Drag .mp4 from File Explorer onto TV | Video plays in TV |
| Local file picker | Right-click → Open File → select .mp4 | Video plays in TV |
| Always-on-top | Toggle in right-click menu → verify TV stays above/below other windows | Correct z-order behavior |
| Resize | Drag corner/edge of TV | TV resizes with locked aspect ratio |
| Move | Drag TV body | TV moves freely |
| CRT intensity knob | Drag top knob | CRT effects intensity changes, value indicator shows |
| Color temperature knob | Drag bottom knob | Color temperature shifts, value indicator shows |
| Power off | Click power button | Power-off animation plays, app exits |
| No video page | Click extension on page without video | Popup shows "No video detected" |
| Tab close (browser video) | Close the source browser tab | TV continues playing independently |
| Multi-monitor | Drag TV to secondary monitor | TV displays correctly |

## Performance Testing
- Monitor CPU/GPU usage during video playback with CRT effects
- Test with different video resolutions (360p, 720p, 1080p, 4K)
- Test on systems with integrated GPU vs dedicated GPU
- Monitor memory usage over extended playback (1+ hour)
