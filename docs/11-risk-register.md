# Technical Risk Register

| ID | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-001 | YouTube URL extraction breaks when YouTube changes its API | 🔴 High | High | Video cannot be extracted from YouTube | Monitor yt-dlp for API changes. Implement a modular extractor that can be updated independently. Fall back to tab capture in v2. |
| R-002 | Frameless transparent window with WebGL has rendering artifacts | 🟡 Medium | Medium | Visual glitches, performance issues | Validate in POC. Tauri v2 has improved transparent window support. Test on multiple GPU drivers. |
| R-003 | Native Messaging setup is fragile (registry keys, paths) | 🟡 Medium | Medium | Extension can't communicate with app | Include NM host registration in the Tauri installer (.msi). Provide troubleshooting guide. |
| R-004 | WebGL CRT shader performance on integrated GPUs | 🟢 Low | Low | Stuttering or high GPU usage | Single-pass shader is lightweight. Allow disabling individual effects. Test on Intel integrated graphics. |
| R-005 | YouTube DASH streams have separate video+audio requiring muxing | 🟡 Medium | High | Audio doesn't play, or requires complex MediaSource API usage | Research MediaSource Extensions (MSE) for combining DASH streams in WebView2. If too complex, fall back to lower-quality combined streams. |
| R-006 | Dynamic screen aspect ratio makes TV body proportions unpredictable | 🟡 Medium | Medium | TV looks stretched or distorted for extreme aspect ratios | Set min/max aspect ratio bounds. Fallback to letterboxing for extreme ratios (e.g., ultra-wide). |
| R-007 | Per-monitor DPI scaling causes rendering issues | 🟢 Low | Low | TV looks blurry or wrong size on secondary monitor | Tauri/WebView2 handles most DPI issues. Test on multi-monitor setup. |
| R-008 | CORS prevents loading extracted video URLs | 🟡 Medium | Medium | Video fails to load in WebView2 | YouTube stream URLs may have CORS restrictions. WebView2 may handle this differently than a browser. Test in POC. |
| R-009 | Click-to-select mode conflicts with page event handlers | 🟢 Low | Medium | User can't select video on some pages | Use pointer-events overlay to intercept clicks. Test on major sites. |
| R-010 | H.265/HEVC not supported without Windows codec | 🟢 Low | Low | Some local MP4 files won't play | Document requirement for HEVC Video Extensions from Microsoft Store. Not all users have it. |

## Risk Priority Order (for POC validation)
1. R-001: YouTube extraction (validate first — entire product depends on it)
2. R-005: DASH audio+video streams (critical for YouTube)
3. R-008: CORS for video URLs in WebView2
4. R-002: Frameless transparent window + WebGL
5. R-003: Native Messaging setup
6. R-006: Dynamic aspect ratio
