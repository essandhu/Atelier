/**
 * Central tab-order map. Every interactive element in the scene and UI layer
 * reads its tabIndex from this object so the Tab traversal stays stable and
 * documented. Ranges (e.g. projectBookStart..projectBookMax) are inclusive
 * on the start, exclusive on the conceptual cap so callers can do
 * `projectBookStart + index` up to `projectBookMax`.
 *
 * Reading order:
 *   skip → intro → webcam → project books → skills catalog → globe
 *   → (eventsFeed reserved)
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
  // Inclusive upper bound — MAX_BOOKS = projectBookMax - projectBookStart + 1.
  // Currently 100..107 ⇒ 8 books. Widen further by bumping this constant; the
  // eventsFeed slot sits at 200 so there's room for ≤ 100 books before
  // collision, but the desk metaphor breaks long before then (see
  // docs/architecture.md §5 for the bookshelf Post-V1 plan).
  projectBookMax: 107,
  // Phase 6 additions — slotted between the projectBookMax ceiling (107) and
  // the reserved eventsFeed slot (200) so any future catalog sub-stops can
  // claim 151..159 without renumbering.
  skillsCatalog: 150,
  globe: 160,
  // RESERVED — same story for the events feed: rendered inline inside
  // LiveActivityBook in V1, not yet a Tab stop. Wired here so the eventual
  // EventsFeedPanel (Section 8 / Post-V1) drops in without churn.
  eventsFeed: 200,
} as const;

export type TabOrderKey = keyof typeof TAB_ORDER;
