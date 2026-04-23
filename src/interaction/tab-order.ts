/**
 * Central tab-order map. Every interactive element in the scene and UI layer
 * reads its tabIndex from this object so the Tab traversal stays stable and
 * documented. Ranges (e.g. projectBookStart..projectBookMax) are inclusive
 * on the start, exclusive on the conceptual cap so callers can do
 * `projectBookStart + index` up to `projectBookMax`.
 *
 * Reading order:
 *   skip → intro → webcam → hero book → project books → contact card →
 *   skills catalog → globe → pinboard → (eventsFeed reserved)
 *
 * Any change here is a user-visible behaviour change — update
 * docs/keyboard-nav.md alongside.
 */
export const TAB_ORDER = {
  skipToFallback: 1,
  introBeginButton: 2,
  webcamToggle: 3,
  // Phase 10 Stage A — the hero book (P10-09) replaces the retired
  // LiveActivityBook at this slot. The hero sits between the intro /
  // webcam pre-scene stops (1..3) and the project-book stack (100+) so
  // a keyboard user lands on the entry case study first, then walks the
  // rest of the desk in order. The numeric slot is preserved from the
  // legacy reservation for migration stability.
  liveActivityBook: 10,
  projectBookStart: 100,
  // Inclusive upper bound — MAX_BOOKS = projectBookMax - projectBookStart + 1.
  // Currently 100..107 ⇒ 8 books. Widen further by bumping this constant; the
  // contactCard slot sits at 110 so there's headroom of 8 slots (108..115)
  // before collision, though the desk metaphor breaks long before then
  // (see docs/architecture.md §5 for the bookshelf Post-V1 plan).
  projectBookMax: 107,
  // Phase 10 Stage A — dockable contact card sits immediately after the
  // project-book range cap so desk-surface objects are traversed as a
  // single group: books → card.
  contactCard: 110,
  // Phase 6 additions — slotted between the contactCard and the back-wall
  // surfaces so any future catalog sub-stops can claim 151..159 without
  // renumbering.
  skillsCatalog: 150,
  globe: 160,
  // Phase 10 Stage A — the wall pinboard (§5.11) is a non-dockable
  // hotspot between the desk surfaces and the reserved eventsFeed slot.
  // Enter / Space opens the EventsFeedPanel in 2D.
  pinboard: 170,
  // Events feed hotspot — historically owned by the LiveActivityBook right
  // page (retired in P10-09) and now reached via the pinboard. Slot kept
  // reserved so any back-compat path has a stable landing.
  eventsFeed: 200,
} as const;

export type TabOrderKey = keyof typeof TAB_ORDER;
