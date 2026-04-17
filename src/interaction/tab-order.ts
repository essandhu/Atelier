/**
 * Central tab-order map. Every interactive element in the scene and UI layer
 * reads its tabIndex from this object so the Tab traversal stays stable and
 * documented. Ranges (e.g. projectBookStart..projectBookMax) are inclusive
 * on the start, exclusive on the conceptual cap so callers can do
 * `projectBookStart + index` up to `projectBookMax`.
 *
 * Any change here is a user-visible behaviour change — update
 * docs/keyboard-nav.md alongside.
 */
export const TAB_ORDER = {
  skipToFallback: 1,
  introBeginButton: 2,
  webcamToggle: 3,
  liveActivityBook: 10,
  projectBookStart: 100,
  projectBookMax: 104,
  eventsFeed: 200,
} as const;

export type TabOrderKey = keyof typeof TAB_ORDER;
