/**
 * Video extraction helpers for HoverTV browser extension.
 * Structured log format: [EXT:extractors:FUNCTION]
 */

import { logInfo } from './utils/logger';

export interface LocationLike {
  pathname: string;
  search: string;
}

export interface SourceElementLike {
  src?: string;
  type?: string;
}

export interface VideoElementLike {
  querySelectorAll: (selector: string) => ArrayLike<SourceElementLike>;
}

export function extractYouTubeUrl(locationObj?: LocationLike): string | null {
  const loc = locationObj || (typeof window !== 'undefined' ? window.location : null);
  if (!loc) return null;

  const urlParams = new URLSearchParams(loc.search);
  const videoId = urlParams.get('v');
  if (videoId) {
    logInfo('extractors', 'extractYouTubeUrl', `Found watch ID: ${videoId}`);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  if (loc.pathname.includes('/shorts/')) {
    const parts = loc.pathname.split('/');
    const shortIdx = parts.indexOf('shorts');
    const shortId = parts[shortIdx + 1];
    if (shortId) {
      logInfo('extractors', 'extractYouTubeUrl', `Found shorts ID: ${shortId}`);
      return `https://www.youtube.com/watch?v=${shortId}`;
    }
  }

  if (loc.pathname.includes('/embed/')) {
    const parts = loc.pathname.split('/');
    const embedIdx = parts.indexOf('embed');
    const embedId = parts[embedIdx + 1];
    if (embedId) {
      logInfo('extractors', 'extractYouTubeUrl', `Found embed ID: ${embedId}`);
      return `https://www.youtube.com/watch?v=${embedId}`;
    }
  }

  return null;
}

export function extractSourceFromChildren(video: VideoElementLike): string | null {
  const sources = Array.from(video.querySelectorAll('source'));
  const preferred = sources.find(
    (s) => s.src && !s.src.startsWith('blob:') && (s.type?.includes('mp4') || s.type?.includes('webm'))
  );
  if (preferred?.src) {
    logInfo('extractors', 'extractSourceFromChildren', `Preferred video source: ${preferred.src}`);
    return preferred.src;
  }

  const anyValid = sources.find((s) => s.src && !s.src.startsWith('blob:'));
  if (anyValid?.src) {
    logInfo('extractors', 'extractSourceFromChildren', `Fallback video source: ${anyValid.src}`);
    return anyValid.src;
  }

  return null;
}
