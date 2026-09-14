# Security & Privacy Model

## Data Access
- The browser extension accesses: the current tab's URL, DOM video elements, and their source URLs
- No browsing history is accessed
- No cookies are accessed
- No user credentials are accessed
- Video URLs are transient — used only to load the video, never stored
- No state persistence means no data is written to disk

## Extension Permissions
| Permission | Justification |
|---|---|
| `activeTab` | Access the current tab's content to find video elements |
| `nativeMessaging` | Communicate with the Tauri desktop app |
| `scripting` | Inject content scripts on demand for video detection and click-to-select mode |

No `tabs`, `history`, `cookies`, or `webRequest` permissions needed.

## Native Messaging Security
- Communication is via stdio pipe (not network)
- Messages are JSON, validated on both sides
- The NM host manifest restricts which extension IDs can connect
- No arbitrary code execution — Tauri app only processes video URLs

## Video URL Handling
- Extracted URLs are used solely to load video in the HTML5 player
- URLs are not logged, stored, or transmitted to any server
- For YouTube, the extracted stream URLs are temporary and expire after a few hours

## Privacy Policy
- Zero data collection
- No analytics
- No telemetry
- No network calls except to fetch the video stream itself
- All processing is local
