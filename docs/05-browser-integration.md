# Browser Integration

## Extension Manifest
The extension uses Manifest V3. Key configurations:
- **Permissions**: `activeTab`, `nativeMessaging`, `scripting`
- **Background**: Service worker for managing the state and Native Messaging connection.
- **Content Scripts**: Injected dynamically via `scripting.executeScript` or defined for specific targets (if persistent operation is required).
- **Native Messaging Host**: Configured to connect to `com.hovertv.host`.

## Native Messaging Setup
- **Host manifest JSON file location**: Defined via Windows registry key.
- **Host manifest format**: Standard Chrome Native Messaging Host JSON specification.
- **Executable path**: Points to the Tauri app backend executable.
- **Allowed extensions/origins**: Must list the extension's ID.
- **Registry key**: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.hovertv.host`

## YouTube URL Extraction Strategy
The approach for extracting YouTube streams:
1. Content script detects `youtube.com/watch` pages.
2. Extract video ID from URL.
3. Access YouTube's player API response (`ytInitialPlayerResponse` or `/youtubei/v1/player` endpoint).
4. Parse streaming data to get adaptive format URLs.
5. Select the format matching current quality.
6. Handle signature decryption if needed.
7. Send the direct stream URL to the Tauri app.

> [!WARNING]
> Risks:
> - YouTube changes API format regularly (⚠️ HIGH RISK)
> - Signature algorithms change
> - Age-restricted or login-required videos may not have accessible stream data
> - This approach may violate YouTube ToS (note: for personal use, small audience)

## Generic HTML5 Video Extraction
1. Content script queries `document.querySelectorAll('video')`.
2. For each video element, extract: `src`, `currentSrc`, `poster`, `duration`, `videoWidth`, `videoHeight`.
3. Filter: must have a valid `src`/`currentSrc` that is not a `blob:` URL.
4. If `src` is a `blob:` URL, attempt to find the original source via `<source>` child elements.
5. Send the URL to the Tauri app.

## Click-to-Select Mode
1. Extension popup sends message to content script: `'ENTER_SELECT_MODE'`.
2. Content script creates an overlay layer covering the page.
3. As user hovers over video elements, highlight them with a colored border/glow.
4. On click, extract the video URL from the clicked element.
5. Remove the overlay, send URL to service worker → Native Messaging → Tauri.

## Play/Pause Sync
1. Content script attaches event listeners to the selected video element:
   - `'play'` event → send `{ type: 'SYNC_STATE', state: 'play' }`
   - `'pause'` event → send `{ type: 'SYNC_STATE', state: 'pause' }`
2. If the video element is removed from DOM or the page navigates away, send `{ type: 'SOURCE_LOST' }`.
3. Service worker forwards these to the Tauri app via Native Messaging.

## Compatibility Matrix
| Environment | Support Level | Notes |
|---|---|---|
| Chrome (latest) | ✅ Full | Primary target |
| Edge (latest) | ✅ Full | Chromium-based |
| Brave (latest) | ✅ Full | Chromium-based |
| Other Chromium | ⚠️ Expected | Untested but should work |
| Firefox | ❌ Not supported | Different extension API |
| Safari | ❌ Not supported | macOS only |
| YouTube (non-DRM) | ✅ Full | YouTube-specific extraction |
| YouTube (DRM/premium) | ❌ Not supported | Encrypted streams |
| HTML5 `<video>` (non-DRM) | ✅ Full | Generic extraction |
| DRM content (any site) | ❌ Not supported | Cannot extract encrypted streams |
| Local files | ✅ Full | Direct file access via Tauri |
