# Atelier — Project Brief

## Overview

A first-person, seated-at-a-desk 3D portfolio website. The viewer sits
at the developer's desk and sees the scene through their eyes. The
composition is fixed — no room navigation, no free movement, no
exploration beyond what is on the desk and immediately around it.

The centerpiece is an open book on the desk showing **live GitHub
activity** pulled from the GitHub GraphQL API. Surrounding objects on
the desk expose the rest of the portfolio content: projects, skills,
experience, and location. Industry/NDA work is represented honestly
via visually distinct "sealed" presentations rather than fabricated or
omitted.

The scene's window ambient lighting shifts with the viewer's local
system time, producing four distinct visual states across the day for
an additional layer of immersion.

The project is a frontend engineering portfolio. Its purpose is to
demonstrate simultaneous craft in creative WebGL, production-quality
2D UI, and real data integration. The 3D scene must impress; the UI
layer must feel like it belongs in a shipped product; the data layer
must be architecturally honest.

## Goals

- Demonstrate expertise in 3D graphics (Three.js, WebGL, shaders,
  post-processing) through a single highly-crafted scene rather than
  sprawling content.
- Demonstrate production-quality 2D UI work through content panels
  that feel like they belong in Linear, Vercel, or Stripe.
- Demonstrate full-stack fluency via a real GitHub GraphQL
  integration with proper caching, error handling, and loading
  states.
- Demonstrate creativity and taste through concept, composition,
  lighting, and motion choreography.
- Provide an accessible, performant experience that works without
  webcam, without reduced motion, and on mobile.
- Ship. The scope is deliberately bounded to be finishable solo.

## Non-Goals

- Free movement, room navigation, or first-person walking.
- Procedurally generated terrain or environments.
- Naturalistic "cheap video game" aesthetics.
- Faking commit volume or career length. Public GitHub history is
  short; the portfolio must be honest about this.
- A metaphor that requires explanation. The desk is immediately
  legible.
- Gimmicky interactions that don't serve the content.
- Live transitions between time-of-day states. State is set on load
  and remains fixed for the session.

## Concept Rationale

Previous concepts considered and rejected:

- **Watchmaker / schematic internals** — attempted previously, the
  schematic/blueprint aesthetic was difficult to make look polished.
- **Resume-as-terrain / procedural city** — arbitrary metaphor, hard
  to make distinctive, prior art saturated.
- **Deep-sea descent** — strong atmosphere but risks feeling random
  without strong onboarding.
- **Observatory / planetarium** — clean but less personal.
- **Geological strata from GitHub commits** — commit data too thin
  (only 2 months of public history; bulk of work is in private
  industry accounts). Would force dishonest representation.
- **Full library room** — interesting but required filling a whole
  room with equally-polished objects, too broad in scope, risked
  feeling like a generic "library portfolio."

The seated-at-a-desk concept was chosen because it:

- Fixes the camera, eliminating navigation complexity entirely.
- Reduces the scope to a small set of objects that can each be
  pushed to high craft quality.
- Provides a diegetic home for every type of content on desk objects.
- Feels personal — the viewer is sitting at *your* desk.
- Performs well because the scene is bounded and mostly static.
- Matches how portfolios are actually consumed: efficiently, with
  clear information hierarchy.

## Aesthetic Direction

**Restrained architectural realism.** Think: a contemporary private
study photographed at the appropriate hour. Physically-based
materials, baked lighting per time-of-day state, real-time light
reserved for interactive highlights and the live-activity glow. The
window provides the ambient fill; the desk lamp provides the warm
key light with varying prominence across the day.

**Explicitly not:** cartoonish, low-poly, fantasy, rough,
procedurally generated, video-game-like, cheap. Every object must
feel individually designed and considered.

**Reference calibration:** Linear, Vercel, Arc, Rauno Freiberg's
personal work, Monument Valley's cleaner compositions, Hopper's
lighting, Kengo Kuma's interior restraint, the Beinecke Rare Book
Library, contemporary arch-viz stills.

**Palette:** warm wood tones, matte stone or concrete surfaces, a
single restrained accent color (pulled through in the lamp's
emission, book ribbons or spines, or similar). Near-black/near-white
system for 2D UI with one accent.

**Two distinct motion languages:**

- 3D camera and scene motion: slower, cinematic, eased.
- 2D UI transitions: snappier, modern, Framer Motion defaults.

## Scene Composition

Fixed camera at seated eye-height, angled slightly down at the desk.
Desk fills the lower frame. Background falls into atmospheric
soft-focus depth — present but never competing. A window is visible
in the background providing the scene's ambient light source (its
specific treatment varies by time-of-day state; see below).

**Desk contents (starting arrangement, flexible in final
execution):**

- **Center, slightly angled toward viewer:** Open book showing live
  GitHub activity. Hero object. Best light. Optical focal point.
- **Left of book:** Small stack of closed books (3–5 visible at
  once), each representing a project. Spines individually designed
  and readable. Additional projects accessible via flip-through or
  reveal-more.
- **Right of book:** A card catalog, index card holder, or Rolodex —
  represents skills/technologies. Visually distinct from the project
  books to avoid reading as "more projects."
- **Upper area of desk (e.g., back-right corner):** A small globe.
  Single marker at the developer's current location. Spinnable with
  momentum decay. Idle slow rotation.
- **Ambient non-interactive objects (3–4 maximum):** Desk lamp (the
  actual key light source), coffee/tea cup with steam, pen, small
  plant, or a piece of paper with notes. Selected for composition
  and to make the scene feel inhabited. Restraint matters — three
  or four, not fifteen.
- **Background:** Quiet but impressive, anchored by a visible window
  providing the ambient/atmospheric lighting. The rest of the
  background (soft-focus bookshelf, wall, framed piece) defers to
  the desk while clearing the visual quality bar.

## Time-of-Day Lighting

The window's atmospheric lighting shifts with the viewer's local
system time, producing four distinct visual states. State is
determined at page load and does not change during the session.
This layers ambient immersion onto the scene — a visitor in the
evening sees a different Atelier than a visitor in the morning, and
each state is composed to be visually complete on its own.

**The four states:**

- **Morning (approx. 5am–10am local time):** Cool blue-white light
  through the window. Long, soft shadows raking across the desk.
  Crisp, awake atmosphere. Desk lamp is present but decorative —
  the window does most of the work. Dust motes in the lamp's cone
  are nearly invisible.
- **Day (approx. 10am–4pm local time):** Neutral bright fill through
  the window. Shorter, softer shadows. The most "normal" lighting,
  baseline reference for material appearance. Desk lamp recedes
  further — often visually off or at very low intensity.
- **Evening (approx. 4pm–8pm local time):** Warm golden-hour light
  through the window. Long, raking shadows with warm tint across
  the desk surface. Hero lighting — the state that most defines the
  scene's aesthetic identity and is the preferred state for
  marketing screenshots. Desk lamp starts to come up in relative
  prominence as outside light drops.
- **Night (approx. 8pm–5am local time):** Cool darkness beyond the
  window (perhaps with subtle cool sky gradient or distant
  implied-city glow). The desk lamp becomes the dominant light
  source. Scene feels intimate and focused. Dust motes in the lamp
  cone are most prominent. The live-activity book's emission reads
  strongest here against the surrounding darkness.

**What varies between states:**

- Window light color temperature and intensity.
- Ambient fill color — the whole room takes a subtle tint from the
  implied sky.
- Shadow direction, length, and softness.
- Desk lamp's real-time light intensity and emission strength.
- Post-processing tuning — bloom emphasis shifts to whichever light
  source dominates the state.
- Dust mote visibility in the lamp's cone.
- Subtle accent-color modulation where appropriate (e.g., the
  live-activity book's emission may warm slightly at evening, cool
  slightly at morning).

**What does not vary between states:**

- Scene composition (object positions, camera).
- Material properties (albedo, roughness, normal, metalness).
  Only the lighting interacting with these materials differs.
- UI styling, typography, accent color system — the 2D layer is
  stable across all states.
- Interactions, affordances, content.

**Transition behavior:**

- State is read from `new Date().getHours()` on initial page load.
- State remains fixed for the duration of the session regardless of
  real-time boundary crossings. No live transitions.
- The ambient motion (page flutter, dust motes, lamp breathe) runs
  normally within the loaded state.

**Development and testing:**

- A URL parameter (`?time=morning|day|evening|night`) forces a
  specific state for development, screenshots, and QA. This
  overrides the system-time detection.
- Each state must be verified to work as a standalone composition
  — any state could be a visitor's first and only impression.
- Screenshots for marketing/social sharing default to evening.

## Always-On Ambient Motion

The scene must never feel frozen. All motion is low-amplitude and
should register as "the scene feels alive" rather than as conscious
animation. Motion runs identically across all time-of-day states,
though some elements (dust motes especially) have different visual
prominence per state.

- Book pages: very subtle flutter, occasional page settle.
- Desk lamp light: imperceptibly slow breathe or flicker (most
  visible in evening and night states when the lamp is prominent).
- Dust motes drifting through the lamp's light cone (very visible at
  night, nearly invisible at day/morning).
- Steam rising from the coffee cup (if present).
- Globe: extremely slow idle rotation.
- Ribbon bookmark or similar small element: gentle sway.

None of this should be noticeable on conscious inspection. If a
viewer notices the animation specifically, it's too strong.

## Interaction Vocabulary

The full set of interactions. Deliberately small.

1. **Hover (mouse or equivalent):** Interactive objects subtly
   highlight or lift. Cursor indicates interactivity. No large
   tooltips.
2. **Click/tap on a book or card:** Object animates out and opens.
   Its 2D UI panel appears composited onto the object's pages or
   surface where technically possible (diegetic UI), or overlaid
   with a clear visual tie to the object where not.
3. **Click/tap on the globe:** Spins with momentum, decays naturally.
   Small UI tag surfaces with current location.
4. **Scroll:** Scrolls content within the currently open UI panel.
   Does nothing when no panel is open (or optionally advances a
   one-time intro sequence on first visit).
5. **Close/Escape:** Closes the currently open object. Camera and
   scene return to ambient state.
6. **Head movement (webcam, optional, opt-in only):** Parallax on
   the scene. Lean left/right to peek around objects. Lean forward
   to subtly dolly toward the desk (as if leaning in to read). Pure
   enhancement. Scene is fully usable without it.

## Book-Opens-to-UI Pattern

This interaction is the most frequent and must feel excellent.

1. Hovering a project book: it slides forward slightly from the
   stack, spine glows very subtly.
2. Clicking: the book pulls fully out, rotates to face the camera,
   and opens with a cinematic camera push-in. Duration ~600–900ms
   with strong easing.
3. As the book opens, its 2D UI panel fades/transitions in,
   composited onto the open pages. The 3D book and the 2D UI share
   the same rectangle of screen space.
4. Panel has real content density: problem, approach, stack, role,
   outcome, screenshots or inline demo, links.
5. User can scroll within the panel if content overflows.
6. Closing (Escape, close button, or clicking outside): panel fades
   out as book closes and returns to its stack position. Camera
   returns to the previous composition.

**Technical approach:** Use drei's `<Html>` component with the
`transform` prop for DOM-based diegetic UI rendered in 3D space.
This keeps the UI as real DOM (good for accessibility, real
component libraries, real typography). Evaluate render-to-texture
only if `<Html>` proves insufficient for a specific effect.

## Live Activity Book (Hero Object)

This is the single most important object in the scene. It deserves
extra craft budget.

**Data:**

- Source: GitHub GraphQL API v4.
- Queries: `contributionsCollection` for the last ~90 days,
  recent `pullRequests`, `issues`, `repositories`, and notable
  events (commits, releases).
- Auth: Personal Access Token held server-side only. Never exposed
  to the client.
- Caching: Fetched at build time for initial payload. Revalidated
  via Next.js ISR on a 1-hour interval. No client-side polling of
  the GitHub API.
- Username: taken from an environment variable, not hardcoded.

**Left page — Contribution grid:**

- 3D-extruded grid of the last ~90 days.
- Cell height proportional to commit count that day.
- Most recent cells have subtle emission (the book visibly glows
  with recent activity). Emission reads most strongly in the night
  state and most warmly in the evening state.
- Color gradient across cells — single accent, varying intensity.
- Hover on a cell reveals a small UI tag with that day's activity
  summary.

**Right page — Recent events feed:**

- Clean typeset list of the last N notable events.
- Each entry: timestamp, repo name, event type, message/title.
- Rendered as sharp, readable typography. Use drei's `<Html>` for
  this unless MSDF 3D text proves equally legible at the camera's
  distance — evaluate both and commit to the sharper result.
- Not a scrolling ticker. Static list, periodic in-place updates.

**States:**

- Loading: pages render with placeholder layout matching final
  shape. No layout shift on data arrival.
- Error: in-character fallback message ("GitHub hasn't replied yet
  — try again in a moment."). Real error logged to the console/
  server logs.
- New activity: when updated data includes new entries, newest
  entry gets a brief underline-slide animation. Page never jumps.

**At-rest motion:**

- Subtle page flutter (very low amplitude).
- Ribbon bookmark sways gently.
- Emission on recent contribution cells has a near-imperceptible
  breathe.

## Project Books

- Each project is a closed book in the left-hand stack.
- Up to ~5 visible at once. More projects accessible via a
  flip-through or "pull more from the shelf" reveal interaction.
- Each spine is individually designed — color, typography, subtle
  material variation. No procedurally generated uniform spines.
- Clicking opens the book via the pattern above.

**Project panel content:**

- Title and one-line summary.
- Role (what you specifically did).
- Problem / context.
- Approach / key decisions.
- Stack / technologies used.
- Outcome / impact / what shipped.
- Screenshots or, where possible, inline demos.
- Links (live site, repo, case study) where public.

**Private / NDA projects:**

- Spine is visually distinct — muted color, subtle "sealed" icon or
  wax seal, different material treatment.
- Opening one reveals a panel that honestly represents what can and
  cannot be shown.
- Tooltip or brief inline note explains the NDA context matter-of-
  factly.
- This is a feature demonstrating professional judgment, not an
  apology for absent content.

## Skills / Tech Catalog

A distinct desk object (card catalog, index card holder, Rolodex, or
similar) representing technologies, tools, and skills.

- Interaction: opens to reveal a categorized UI panel.
- Not a word cloud or visual tag soup.
- Grouped by category (e.g., Frontend, 3D/Creative, Backend,
  Tooling) with clean type hierarchy.
- Each skill includes context: years of use, projects it connects
  to (with clickable references that jump to the relevant project
  book), or contexts in which it was applied.
- Looks like something shipped in a real product, not a résumé
  dump.

## Globe

- Small, tastefully placed on the desk (back-right corner is a
  natural fit).
- Real PBR materials on sphere and stand.
- Single marker at the developer's current city.
- Spinnable: click-and-drag imparts momentum, rotation decays
  naturally.
- Idle: extremely slow rotation when not being interacted with.
- Clicking the marker surfaces a small UI tag: current location and
  a brief "currently based in…" note.
- Deliberately not overloaded. One marker, one tag.

## Page Startup Sequence

1. **Initial load:** Minimal typography-driven loading UI. No
   spinner gimmicks. Progress indication if scene assets take time.
2. **Time-of-day state resolution:** On load, the client reads local
   system time and selects the appropriate state (morning, day,
   evening, or night). The corresponding lightmap set is loaded
   before the scene renders to avoid visible re-lighting.
3. **First render:** Desk lamp "turns on" — scene lights up from
   dark over ~1.5 seconds into its time-of-day state. Book pages
   settle as if just opened. The startup animation adapts to the
   state: at night, the lamp-on moment is the dominant change; at
   day, the window light is the dominant change; evening and
   morning blend the two.
4. **Intro overlay appears:** Real DOM UI, corner-anchored (not
   floating 3D text), styled with shadcn/ui and the project's
   accent color. Contents:
   - Developer's name, role, one-sentence positioning.
   - Brief note on what to expect: "You're sitting at my desk.
     Click objects to explore."
   - Camera controls explainer with the opt-in:
     - "Optional: enable webcam for head-tracked parallax."
     - "Otherwise, use mouse/touch and keyboard — everything works
       normally without the camera."
   - A button to enable webcam (prompts permission, loads
     MediaPipe lazily).
   - A button to dismiss and begin.
5. **After dismiss:** A subtle affordance hint draws the eye to
   the first interaction — e.g., the nearest project book lifts a
   millimeter and settles, or a subtle glow passes across the
   live-activity book. One-time; does not repeat.

## Accessibility & Fallbacks

- **Webcam:** Never required. Never aggressively prompted. Tasteful
  toggle available after initial dismiss (small corner control).
  Lazy-loaded only on opt-in.
- **Keyboard navigation:** Tab through interactive objects in a
  logical order. Enter or Space to activate. Escape to close.
  Visible focus indicators on all interactive objects.
- **Reduced motion:** Respects `prefers-reduced-motion`. Ambient
  motion drops to near-zero. Camera transitions become near-instant
  cuts. Lamp-on startup animation is skipped — the scene loads
  directly into its time-of-day state. Book-open animation
  shortened or replaced with a simpler transition.
- **Mobile:** Webcam disabled entirely. Device orientation can
  optionally drive subtle parallax (opt-in toggle). Scene reframes
  to a tighter composition on narrow viewports. All interactions
  remain available via touch. UI panels become full-screen sheets
  on small screens. Time-of-day states apply identically on mobile.
- **No-JavaScript fallback:** The 3D scene is the product, so the
  full experience requires JS. A no-script fallback page presents
  the portfolio content as clean, semantic HTML — all projects,
  skills, experience, contact, and current GitHub activity —
  styled with the same design system. Functionally complete, just
  without the scene. The fallback is time-of-day agnostic.
- **Screen readers:** All interactive 3D objects have accessible
  names and roles via `aria-label` on their associated DOM
  elements or drei `<Html>` wrappers. Opening a book announces the
  panel's contents. The scene itself is decorative from an AT
  perspective; content must be reachable without navigating the
  3D.

## Visual Quality Bar

In a fixed scene, nothing can hide. Every object and the background
must clear a high bar across all four time-of-day states.

- **Materials:** Real PBR — albedo, roughness, normal, metalness,
  AO as appropriate. No flat-shaded placeholders in the final
  product. Materials do not change between states; only the
  lighting interacting with them does.
- **Typography in 3D:** Use MSDF text (troika-three-text via drei's
  `<Text>`) for any 3D type (book spines, any labels in scene).
  Sharp and readable at the camera's distance.
- **Typography in 2D UI:** One sans (Inter, Geist, or similar) for
  UI. One mono (JetBrains Mono, Geist Mono) for technical details
  and code. No decorative fonts floating in 3D.
- **Lighting:** Baked per time-of-day state. Four lightmap sets
  total, one per state, loaded based on system time. Real-time
  lights reserved for:
  - The desk lamp's key light, with state-dependent intensity.
  - Live-activity emission.
  - Hover highlights.
- **Post-processing pipeline:** Bloom on emissive surfaces, tuned
  per state (stronger on lamp at night, stronger on window at
  evening). Subtle chromatic aberration. Very low-intensity film
  grain. Color grading as a final tone-map or LUT pass — each
  state may have its own tone-map target to enhance the mood.
- **Depth of field:** Subtle. Desk in focus, background softly
  falling off. Do not use aggressive bokeh.
- **Shadows:** Soft, high-quality. Baked per state (shadow
  direction varies across states). Real-time shadows only where
  needed for interactive elements.
- **Cross-state consistency:** All four states must feel like the
  same scene at different times, not four different scenes. This
  means shared composition, shared materials, shared accent color
  system — the shift is in light, not identity.

## Technology Stack

- **Framework:** Next.js (App Router, TypeScript). Enables
  SSR/ISR for GitHub data fetching and provides a clean boundary
  for the server-side token.
- **3D:** React Three Fiber + drei. Keeps scene colocated with
  React components; simplifies the UI-inside-3D pattern via
  `<Html>`.
- **Post-processing:** `@react-three/postprocessing`.
- **2D UI:** shadcn/ui as a component base, customized to the
  project's accent color and type system. Tailwind CSS for
  styling.
- **UI motion:** Framer Motion for panel transitions and UI
  animations.
- **Webcam / head-tracking:** MediaPipe Face Landmarker (or
  equivalent). Lazy-loaded only when the user opts in. Disabled
  on mobile.
- **3D typography:** troika-three-text via drei's `<Text>`.
- **Diegetic UI in 3D:** drei's `<Html>` with `transform` prop.
  Evaluate render-to-texture only if specific effects require it.
- **GitHub API:** GraphQL queries via a thin server-side fetch
  wrapper. No additional client library required.
- **Assets:**
  - Models: GLTF/GLB, Draco compression for geometry.
  - Textures: KTX2/Basis where supported, fallback to WebP/PNG.
  - Lightmaps: four sets (one per time-of-day state), lazy-loaded
    so only the active state's lightmap is fetched on initial page
    load.
  - Lazy-load scene assets; keep initial bundle lean.

## Architecture Principles

- **Clear separation of concerns:**
  - 3D scene code (R3F components, materials, lighting).
  - Server-side data layer (GitHub GraphQL fetcher, caching).
  - 2D UI components (shadcn-based panels, overlays, controls).
  - Shared types / schema for project and skill content.
  - Time-of-day state as a cross-cutting concern — exposed via a
    single source of truth (e.g., a context or store) and consumed
    by scene, lighting, and post-processing layers.
- **Content as data:** Projects, skills, and experience live in a
  structured data format (JSON or TypeScript modules), not
  hardcoded in components. This is the authored career data
  replacing thin public commit history.
- **Server-side token handling:** The GitHub PAT is never shipped
  to the client. All GitHub API calls happen at build time or in
  server-side ISR revalidation.
- **Progressive enhancement:** Scene must work without webcam.
  UI must work without JavaScript (fallback page). Reduced motion
  is a first-class state, not an afterthought. Time-of-day is
  purely a visual layer — no content or functionality depends on
  which state is active.
- **Asset discipline:** Nothing loads until it's needed. Webcam
  and MediaPipe are opt-in. Scene assets are lazy-loaded beyond
  the initial hero composition. Only the active lightmap set is
  fetched per session — the other three are not downloaded at all
  unless explicitly requested via the URL override.

## Performance Budget

- 60fps on a mid-tier laptop (M1 Air class) across all four
  time-of-day states. Night state is the most demanding (strongest
  real-time lamp light, most visible bloom, most visible dust
  motes) and is the performance reference.
- Initial JS bundle < 1MB (excluding scene assets).
- Total scene asset size (geometry + textures + single active
  lightmap set) < 15MB. Lazy-load anything beyond the first render.
- Additional lightmap sets are not counted in the initial budget
  because they are never fetched unless the URL override is used.
- Webcam and MediaPipe assets load only on opt-in.
- Lighthouse performance score ≥ 80 on desktop.
- First Contentful Paint < 2s on a good connection.
- Time to Interactive < 4s on a good connection.

## Content To Be Supplied

Before implementation can begin, the developer will provide:

- Full name, current role/title, one-sentence positioning.
- GitHub username.
- GitHub PAT with `read:user`, `repo` (if including private repo
  activity is desired), and relevant read scopes. Stored as env
  var.
- Current city (for globe marker).
- Project list with, for each project:
  - Title, summary, role, problem, approach, stack, outcome,
    screenshots/demo links, public URLs, public/NDA status.
- Skills list grouped by category, with years/context for each.
- Experience / roles timeline (even summarized).
- Contact preferences (email, social links, resume download).
- Accent color preference (or willingness to let it be chosen by
  the designer).

## What "V1 Done" Looks Like

- Hero shot: desk, lamp, window, open live-activity book, immediate
  background — fully lit, textured, and composed across all four
  time-of-day states.
- All four time-of-day states implemented and validated
  independently, with the URL override working for development and
  testing.
- Live GitHub data wired end-to-end: GraphQL fetch, ISR caching,
  proper loading/error/update states.
- One fully-interactive project book — click, open, show populated
  UI panel, close, return to stack.
- Startup sequence with state-aware lamp-on animation and intro
  overlay (webcam copy present as placeholder; actual webcam toggle
  not yet required for V1).
- Keyboard navigation through interactive objects.
- `prefers-reduced-motion` support across all states.
- Mobile responsive: reframed composition, webcam disabled, touch
  interactions working, all four states applying correctly.
- No-script fallback page with portfolio content as semantic HTML.
- Lighthouse performance score ≥ 80 on desktop in the night state
  (the most demanding).

## Post-V1 Scope (Subsequent Tasks)

Explicitly not in V1. Each is a focused follow-up task.

- Remaining project books (beyond the one proven in V1).
- Skills / tech catalog object and its UI panel.
- Globe with current location marker and spin interaction.
- Webcam head-tracking and parallax (MediaPipe integration + opt-in
  toggle).
- Device orientation parallax on mobile.
- Full background treatment (bookshelf, window detail, wall piece).
- Additional ambient objects (coffee cup with steam, plant, pen,
  notes, etc.).
- Post-processing polish pass (tune bloom, chromatic aberration,
  grain, color grade per state).
- Asset optimization pass (texture compression, geometry
  compression, lazy-load tuning).
- Final accessibility audit and screen reader pass.
- Live transitions between time-of-day states on real-time boundary
  crossings (explicitly deferred; not planned unless the scene
  proves itself and there's appetite for the polish).

## Known Risks

- **Fixed scenes scrutinize every object.** With no navigation,
  nothing can hide. Mitigation: push each object further than feels
  necessary; fewer objects, higher quality per object.
- **Fixed scenes can feel frozen.** Mitigation: always-on ambient
  motion at low amplitude on multiple elements.
- **Library/desk portfolios have prior art.** Craft quality is the
  differentiator, not novelty. Mitigation: disproportionate
  investment in the hero shot, the book-open interaction, and
  typography/lighting.
- **Thin public GitHub history.** Live activity book will show
  recent work only. Mitigation: this is framed honestly as "recent
  activity" rather than "lifetime history"; the curated content
  (projects, skills, experience) carries the weight of the career
  narrative.
- **3D-to-UI integration complexity.** The diegetic UI pattern
  (drei `<Html>` composited on book pages) is the highest-risk
  technical element. Mitigation: prove it end-to-end in V1 on the
  hero object before building any other interactive objects.
- **Asset budget creep.** High visual quality bar tempts large
  textures and models. Mitigation: enforce the performance budget
  as a hard gate; KTX2/Basis/Draco from day one.
- **Time-of-day lighting quadruples lighting iteration cost.** Every
  change to scene composition or materials requires re-baking four
  lightmap sets. Mitigation: lock composition and materials before
  beginning the full bake pass; iterate with a single "working"
  state (evening) during development and bake the remaining three
  once the scene is stable. The URL override enables fast
  state-specific QA without re-baking.
- **State parity risk.** One or more states may look noticeably
  weaker than the others. Mitigation: each state must be
  independently reviewed and approved as a standalone composition;
  no state ships until it matches the quality of the strongest
  state.
- **Lightmap asset size.** Four full lightmap sets could bloat
  total project size even if only one is fetched per session.
  Mitigation: KTX2/Basis compression on lightmaps; sensible
  resolution targets; validate total project size in CI so regressions
  are caught.