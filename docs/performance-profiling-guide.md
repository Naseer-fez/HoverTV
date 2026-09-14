# 🚀 HoverTV Performance Profiling & Resource Guardrails Guide

This guide establishes the performance profiling benchmarks, memory leak checks, and resource guardrails for HoverTV across development and production builds.

---

## 1. WebGL Texture Re-allocation & Memory Leak Checks

### Architecture Context
HoverTV's WebGL2 CRT shader pipeline runs a continuous `requestAnimationFrame` loop that streams video frames to the GPU (`tauri-app/src/features/shader/renderer.ts`).

```typescript
// renderer.ts - In-place texture update pattern
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, videoTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, targetVideo);
```

### Verification Procedure
1. Launch HoverTV with WebView2 remote debugging enabled:
   ```powershell
   # Launch in dev mode with DevTools available
   cd tauri-app && pnpm tauri dev
   ```
2. In Edge or Chrome, navigate to `edge://inspect` or `chrome://inspect` and inspect the HoverTV WebView window.
3. Switch to the **Memory** tab.
4. Take an initial heap snapshot at **$t = 0$** (idle/static state).
5. Pipe or play a high-definition 1080p video stream for **5 minutes** ($t = 300\text{ s}$).
6. Take a second heap snapshot at **$t = 300\text{ s}$**.
7. Stop video playback (transition back to static/off) and trigger a garbage collection (trash icon).
8. Take a third heap snapshot at **$t = 360\text{ s}$**.

### Pass Criteria
- **Heap Growth**: Retained JS heap memory between $t = 0$ and $t = 360\text{ s}$ must be within $\pm 2.0\text{ MB}$.
- **Texture Counts**: The number of allocated `WebGLTexture` instances must remain strictly **1** (no new texture allocations per frame).
- **ArrayBuffers**: No accumulation of detached `ArrayBuffer` or `Float32Array` objects.

---

## 2. Frame Rate Stability (Consistent 60 FPS)

### Benchmark Thresholds
| TV State | Target FPS | Max Frame Time | Description |
| :--- | :--- | :--- | :--- |
| **OFF** | 0 / Idle | N/A | rAF cancels; rendering halted |
| **STATIC** | 60 FPS | $\le 16.6\text{ ms}$ | Fullscreen procedural noise + roll shader |
| **PLAYING** | 60 FPS | $\le 16.6\text{ ms}$ | Video texture upload + all 6 CRT post-processing passes |
| **TRANSITIONS** | 60 FPS | $\le 16.6\text{ ms}$ | Multi-phase cathode ray beam collapse / expansion |

### Verification Procedure
1. Open DevTools via `edge://inspect`.
2. Navigate to the **Performance** tab.
3. Click **Record** and play an active 60 FPS video for 10 seconds.
4. Click **Stop** to inspect the timeline.
5. Review the **Frames** swimlane and **Summary** breakdown:
   - Verify that 98%+ of frames are completed in under $16.6\text{ ms}$.
   - Ensure scripting time per frame is under $3.0\text{ ms}$.
   - Ensure rendering/GPU draw time per frame is under $8.0\text{ ms}$.

---

## 3. CPU / GPU Resource Overhead Monitoring

### Resource Guardrails on Windows (Target: Intel i5 10th Gen or Ryzen 5 with iGPU or dGPU)
| TV State | CPU Overhead | GPU Overhead | RAM / Private Working Set |
| :--- | :--- | :--- | :--- |
| **OFF** | $< 0.5\%$ | $0.0\%$ | $< 90\text{ MB}$ |
| **STATIC** | $< 3.0\%$ | $< 5.0\%$ | $< 120\text{ MB}$ |
| **PLAYING (1080p)** | $< 5.0\%$ | $< 10.0\%$ | $< 180\text{ MB}$ |

### Verification Procedure
1. Open **Windows Task Manager** (`Ctrl + Shift + Esc`) and go to the **Details** tab.
2. Locate `hovertv.exe` and its associated `msedgewebview2.exe` child processes.
3. Add columns: **CPU**, **Memory (Private Working Set)**, **GPU**, and **GPU Engine**.
4. Measure and log resource consumption under each state:
   - **Step A: OFF state**: Turn off HoverTV (power button). Observe baseline CPU/GPU.
   - **Step B: STATIC state**: Turn on HoverTV with no video input. Observe static noise load.
   - **Step C: PLAYING state**: Pipe a 1080p YouTube video. Observe video decoding + WebGL rendering load.
   - **Step D: Long-running test**: Let run for 30 minutes. Check for memory bloat.

---

## 4. Known Optimization Opportunities

1. **Uniform Location Caching**:
   - Currently, `renderer.ts:updateUniforms` calls `gl.getUniformLocation` each frame.
   - In future phases, these locations can be cached in a lookup object during `initShaderProgram` to eliminate ~12 JS-to-WebGL API calls per frame.
2. **Dynamic Canvas Throttling**:
   - When the TV is in the `OFF` state, `requestAnimationFrame` is already cancelled, ensuring 0% GPU utilization.
