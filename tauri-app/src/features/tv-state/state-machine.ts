/**
 * HoverTV State Machine
 * Dedicated pure transition function for TV states and events.
 * Strict adherence to SKILL.md Section 3.
 */

export enum TVState {
  OFF = 'OFF',
  POWERING_ON = 'POWERING_ON',
  STATIC = 'STATIC',
  PLAYING = 'PLAYING',
  POWERING_OFF = 'POWERING_OFF',
}

export type TVEvent =
  | { type: 'POWER_TOGGLE' }
  | { type: 'ANIMATION_COMPLETE' }
  | { type: 'RECEIVE_VIDEO'; url: string; title?: string; source: 'youtube' | 'html5' | 'local' }
  | { type: 'SOURCE_LOST' }
  | { type: 'VIDEO_ENDED' };

export function transition(current: TVState, event: TVEvent): TVState {
  switch (current) {
    case TVState.OFF:
      if (event.type === 'POWER_TOGGLE' || event.type === 'RECEIVE_VIDEO') return TVState.POWERING_ON;
      return current;

    case TVState.POWERING_ON:
      return event.type === 'ANIMATION_COMPLETE' ? TVState.STATIC : current;

    case TVState.STATIC:
      if (event.type === 'POWER_TOGGLE') return TVState.POWERING_OFF;
      if (event.type === 'RECEIVE_VIDEO') return TVState.PLAYING;
      return current;

    case TVState.PLAYING:
      if (event.type === 'POWER_TOGGLE') return TVState.POWERING_OFF;
      if (event.type === 'SOURCE_LOST' || event.type === 'VIDEO_ENDED') return TVState.STATIC;
      if (event.type === 'RECEIVE_VIDEO') return TVState.PLAYING;
      return current;

    case TVState.POWERING_OFF:
      return event.type === 'ANIMATION_COMPLETE' ? TVState.OFF : current;

    default:
      return current;
  }
}
