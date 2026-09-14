// CANONICAL. Mirrored in: tauri-app/src/types/messages.ts and src-tauri/src/messages.rs

/** Messages sent from Browser Extension to Desktop App */
export type ExtensionMessage =
  | { type: 'PLAY_URL'; url: string; title?: string; source: 'youtube' | 'html5' | 'local' }
  | { type: 'SYNC_STATE'; state: 'play' | 'pause' }
  | { type: 'SOURCE_LOST' };

/** Messages sent from Desktop App to Browser Extension */
export type AppMessage =
  | { type: 'READY' }
  | { type: 'STATUS'; status: 'playing' | 'paused' | 'static' | 'off' };
