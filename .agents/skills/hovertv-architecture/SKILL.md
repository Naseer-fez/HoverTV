---
name: hovertv-architecture
description: Developer Guide and Architecture Rules for the HoverTV codebase.
---

# HoverTV Developer Guide & Architecture Rules

This document outlines the strict architectural rules, coding standards, and project structure for the HoverTV repository. All AI agents working on this codebase MUST adhere to these rules to ensure the codebase remains maintainable, predictable, and AI-friendly.

## 1. Modularity & File Size Limits

To keep context windows small and code highly focused, adhere to the following modularity rules:

- **Function Limits**:
  - Maximum **50 lines** per function.
  - Maximum **2 tasks** per function. Break down complex logic into helper functions.
  - Every function MUST have proper logging (see Logging standards).
- **Class Limits**:
  - Maximum **30 methods** per class.
- **File Limits**:
  - **Soft Limit**: ~300 lines per file (excluding GLSL shaders). If a file exceeds this limit, consider it a trigger to refactor and split the file into logical submodules.

## 2. Architectural Boundaries

HoverTV consists of three distinct components: the Browser Extension, the Rust Backend, and the WebView2 Frontend. Boundaries must be strictly maintained.

- **Browser Extension (TypeScript)**:
  - **Role**: "Dumb pipe".
  - **Responsibilities**: Video detection, URL extraction, sending messages via Native Messaging.
  - **Forbidden**: No business logic, no state management.
- **Tauri Rust Backend**:
  - **Role**: OS Integration & IPC Relay.
  - **Responsibilities (State Owner)**: Owns persistent and OS-native state:
    - Window position and size persistence (reads/writes config, applies on startup).
    - Always-on-top toggle state (manages OS flag directly).
    - Volume level storage (frontend reads on init).
    - TV power state (tracks ON/OFF for tray icon or NM responses).
    - File dialogs (opens native dialog, returns path to frontend).
  - **Forbidden**: No UI rendering, no shader logic, no HTML5 video manipulation.
- **WebView2 Frontend (TypeScript/HTML/WebGL)**:
  - **Role**: The "Brain" and Renderer.
  - **Responsibilities**: Owns all runtime and visual application state (shader params, animations, playback position), state machine logic, WebGL pipeline, and user interactions.

## 3. State Management

- **TV State Machine**:
  - Located in a single, dedicated file (e.g., `src/features/tv-state/state-machine.ts`).
  - Implemented as an explicit transition function with a `TVState` enum, `TVEvent` union, and a pure `transition(state, event)` function.
- **Other Frontend State (Volume, Knobs, Shader Params, Video URL)**:
  - Use the **Plain TypeScript Module pattern**.
  - No reactive frameworks (no RxJS, XState, or signals).
  - State is managed via exported getter/setter functions and a simple event emitter (e.g., `export function setIntensity(v) { ... emit('change', v); }`).

## 4. Type Safety & IPC Contracts

Type contracts must be strictly maintained across the IPC boundaries without relying on complex auto-generation pipelines.

- **Strategy**: Manual mirroring with strict canonical tracking.
- **Location**:
  - **Extension Canonical Types**: `extension/src/types/messages.ts` (This is the source of truth for NM). Include comment: `// CANONICAL. Mirrored in: tauri-app/src/types/messages.ts and src-tauri/src/messages.rs`
  - **Frontend Mirrored Types**: `tauri-app/src/types/messages.ts`. Include comment: `// MIRROR OF: extension/src/types/messages.ts`
  - **Rust Mirrored Types**: `src-tauri/src/messages.rs`. Use `serde` (`#[serde(tag = "type")]`). Include comment: `// MIRROR OF: extension/src/types/messages.ts`
- **Rule**: Whenever an IPC message type changes, you MUST update all mirrored copies simultaneously.

## 5. Logging & Error Handling

Debugging relies on clean, predictable terminal output.

- **Structured Log Format**: All logs across all three components MUST use the following prefix format:
  ```
  [COMPONENT:MODULE:FUNCTION] message
  ```
  - Examples: `[EXT:content-script:extractVideoUrl]`, `[RUST:native-messaging:handle_message]`, `[UI:state-machine:transition]`.
- **Error Handling & Propagation**:
  - **Log once at the boundary**: Errors should bubble up via a context chain and be logged exactly ONCE at the component boundary (e.g., when crossing from Rust to Frontend).
  - Internal functions should return/throw errors with added context but MUST NOT log them directly to avoid duplicate log spam.
  - Example: `[RUST:nm:handle_stdin] ERROR: NM message processing failed | parse_message: invalid JSON at byte 42 | raw: '{bad...}'`

## 6. Codebase Navigation (Directory Structure)

The codebase must follow a strict **Feature-Based Grouping** structure, particularly for the frontend. Do not group by file type (e.g., no generic `components/` or `utils/` folders for domain logic).

**Expected Frontend Structure:**
```text
tauri-app/src/
  features/
    tv-state/      # state-machine.ts, store.ts, events.ts
    shader/        # crt.frag, crt.vert, renderer.ts, uniforms.ts
    video-player/  # player.ts, html5.ts, local-file.ts
    ui/            # tv-body.html, knobs.ts, context-menu.ts
  core/
    ipc/           # messages.ts, tauri-bridge.ts
    utils/         # math.ts, logger.ts
```

When adding new logic, determine its domain (feature) and place it in the corresponding feature directory.
