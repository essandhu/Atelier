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
  // RESERVED — LiveActivityBook is not a focus stop in V1 (the book is a
  // visual surface; its individual cells aren't keyboard-actionable yet).
  // The slot is reserved so day-1 of "make activity interactive" doesn't
  // need to renumber the projectBook range. Keep ahead of projectBookStart.
  liveActivityBook: 10,
  projectBookStart: 100,
  projectBookMax: 104,
  // RESERVED — same story for the events feed: rendered inline inside
  // LiveActivityBook in V1, not yet a Tab stop. Wired here so the eventual
  // EventsFeedPanel (Section 8 / Post-V1) drops in without churn.
  eventsFeed: 200,
} as const;

export type TabOrderKey = keyof typeof TAB_ORDER;
