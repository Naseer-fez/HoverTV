# Performance Specification

## Targets
- No hard CPU/GPU limits, but optimize for minimal resource usage
- Goal: lighter than a browser tab playing the same video
- Video decoding should use hardware acceleration (WebView2 default)
- CRT shader effects run on the GPU (WebGL)
- Idle (static screen): minimal CPU, near-zero GPU
- Playing video with CRT effects: reasonable CPU for video decode, low GPU for shader

## Memory Budget
- Target: < 100MB RAM during video playback
- Tauri + WebView2 baseline: ~40-60MB
- Video buffer + WebGL textures: ~20-40MB depending on resolution

## Frame Rate
- CRT shader should maintain 30fps minimum at any TV window size
- WebGL rendering loop uses `requestAnimationFrame`
- Video texture upload happens once per video frame (not per display frame)

## Optimization Strategies
- Use hardware-accelerated video decoding (WebView2 default)
- Single-pass fragment shader (all effects in one draw call)
- Don't re-upload video texture if frame hasn't changed (check `video.currentTime`)
- Pause the render loop when TV is minimized or fully occluded
- Use appropriate WebGL texture format (RGBA, not Float)
- Avoid CPU-side pixel manipulation
