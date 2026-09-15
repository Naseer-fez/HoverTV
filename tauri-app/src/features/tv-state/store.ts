import { TVState, TVEvent, transition } from './state-machine';
import { logInfo } from '../../core/utils/logger';

type StateListener = (state: TVState, prev: TVState) => void;

export interface PendingVideo {
  url: string;
  title?: string;
  source: 'youtube' | 'html5' | 'local';
}

type PendingVideoConsumer = (video: PendingVideo) => void;

let currentState: TVState = TVState.OFF;
let activeVideoUrl: string | null = null;
let activeVideoTitle: string | null = null;
let pendingVideo: PendingVideo | null = null;
const listeners: Set<StateListener> = new Set();
let pendingVideoConsumer: PendingVideoConsumer | null = null;

export function onPendingVideoConsumed(consumer: PendingVideoConsumer): void {
  pendingVideoConsumer = consumer;
}

export function getState(): TVState {
  return currentState;
}

export function getActiveVideo(): { url: string | null; title: string | null } {
  return { url: activeVideoUrl, title: activeVideoTitle };
}

export function dispatch(event: TVEvent): TVState {
  const prev = currentState;
  const next = transition(prev, event);

  if (event.type === 'RECEIVE_VIDEO') {
    activeVideoUrl = event.url;
    activeVideoTitle = event.title || 'Untitled';
    if (prev === TVState.OFF || prev === TVState.POWERING_ON) {
      pendingVideo = { url: event.url, title: event.title, source: event.source };
    }
  } else if (next === TVState.OFF) {
    activeVideoUrl = null;
    activeVideoTitle = null;
    pendingVideo = null;
  } else if (next === TVState.STATIC && !pendingVideo) {
    activeVideoUrl = null;
    activeVideoTitle = null;
  }

  logInfo('tv-state', 'dispatch', `Event: ${event.type} -> State: ${prev} => ${next}`);
  if (prev !== next) {
    currentState = next;
    listeners.forEach((listener) => listener(next, prev));

    if (prev === TVState.POWERING_ON && next === TVState.STATIC && pendingVideo) {
      const video = pendingVideo;
      pendingVideo = null;
      queueMicrotask(() => {
        dispatch({ type: 'RECEIVE_VIDEO', ...video });
        if (pendingVideoConsumer) {
          pendingVideoConsumer(video);
        }
      });
    }
  }
  return currentState;
}

export function hasPendingVideo(): boolean {
  return pendingVideo !== null;
}

export function onStateChange(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
