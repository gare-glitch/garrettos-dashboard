---
# GarrettOS DESIGN.md
# Visual source of truth: Stitch project 12895490246031623746
# Format: Refero Styles DESIGN.md specification (YAML tokens + markdown rationale)
# Status: Living document — update when Stitch tokens or motion rules change

product:
  name: GarrettOS
  identity: "Calm operator console for a personal OS — agents, memory, biometrics, revenue, and systems in one dark glass workspace."
  tone: ["calm", "precise", "premium", "instrument-grade", "non-flashy"]
  audience: "Solo operator running agents, VPS, and personal data. Power user who reads dense screens but does not want noise."

tokens:
  colors:
    # Semantic roles — these are the only color names an agent should use.
    background: "#06151e"           # app background
    foreground: "#d5e5f1"           # default text
    surface: "#06151e"              # base surface
    surface_dim: "#06151e"
    surface_container_lowest: "#021018"   # inputs, code wells
    surface_container_low: "#0e1d26"      # nested panels
    surface_container: "#12212a"          # default card body
    surface_container_high: "#1d2c35"     # hover / chip bg
    surface_container_highest: "#283740"  # table headers, progress tracks
    surface_variant: "#283740"
    surface_bright: "#2c3b45"

    primary: "#ecbda4"              # warm sand — PRIMARY accent, links, active state, brand
    primary_foreground: "#462918"
    secondary: "#b9cda4"            # sage — "good"/positive status, success
    tertiary: "#b8c8da"             # steel blue — "info", neutral data, charts
    outline: "#889295"              # muted labels, captions, secondary text
    outline_variant: "#3f484b"      # subtle dividers
    on_surface: "#d5e5f1"           # primary text on surface
    on_surface_variant: "#bec8cb"   # secondary text on surface
    error: "#ffb4ab"                # errors, destructive, "bad" status
    error_container: "#93000a"

  typography:
    family_sans: "Geist Sans (via next/font), ui-sans-serif, system-ui"
    family_mono: "Geist Mono (via next/font), ui-monospace, monospace"
    icons: "Material Symbols Outlined (opsz 20..48, wght 300..400, FILL 0..1)"
    scale:
      label_caps: { size: "0.6875rem", weight: 600, tracking: "0.08em", transform: uppercase, role: "eyebrows, section labels, status chips, table headers" }
      code: { size: "0.8125rem", family: mono, role: "log streams, terminal, ids, env vars" }
      body_sm: { size: "0.875rem", role: "default body text in dense UI" }
      body_lg: { size: "1rem", role: "primary body text, list items" }
      headline_md: { size: "1.25rem", weight: 600, role: "section titles, card titles" }
      headline_lg: { size: "2rem", weight: 600, tracking: "-0.02em", role: "page title" }
      display: { size: "3rem", weight: 700, tracking: "-0.04em", role: "hero metrics only" }

  spacing:
    gutter: "1rem"                # primary gap between cards/columns
    margin_mobile: "1rem"         # page horizontal padding < md
    margin_desktop: "2rem"        # page horizontal padding >= md
    sidebar: "16.5rem"            # 264px side nav width
    topbar: "4rem"                # 64px top app bar height
    dock: "3.5rem"                # 56px floating dock height
    dock_safe: "7rem"             # bottom padding so content clears the dock
    max_width: "100rem"           # 1600px page max width
    unit: "0.25rem"               # base unit (Tailwind space-1)

  radius:
    sm: "0.125rem"
    md: "0.25rem"
    lg: "0.5rem"                  # default for chips, inputs, small elements
    xl: "0.75rem"                 # default for cards
    "2xl": "1rem"                 # large panels
    "3xl": "1.25rem"
    full: "9999px"                # pills, pips, avatars

  elevation:
    glass_panel: "inset 1px 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.28)"
    milled_border: "inset 1px 1px 0 rgba(255,255,255,0.05), 0 4px 30px rgba(0,0,0,0.4)"
    glow_primary: "0 0 15px -5px rgba(236,189,164,0.35)"
    glow_ring: "0 0 0 1px rgba(236,189,164,0.2), 0 0 32px rgba(236,189,164,0.08)"

  motion:
    ease_premium: "cubic-bezier(0.22, 1, 0.36, 1)"   # default for fades/reveals
    ease_dock: "cubic-bezier(0.34, 1.56, 0.64, 1)"   # dock magnetic overshoot only
    duration_fast: "150ms"
    duration_normal: "250ms"
    duration_slow: "400ms"
    duration_breathe: "3s"        # status pip pulse
    springs:
      default: { stiffness: 420, damping: 34 }
      soft: { stiffness: 260, damping: 28 }       # scroll reveals, staggers
      dock: { stiffness: 380, damping: 28, mass: 0.8 }
      palette: { stiffness: 400, damping: 32 }     # overlays/dialogs
    stagger: "0.04-0.05s per child"
    reduced_motion: "All non-essential animation MUST collapse to { duration: 0 }."

  glass_surfaces:
    panel:
      bg: "rgba(18, 33, 42, 0.55)"
      blur: "24px saturate(160%)"
      border: "1px rgba(255,255,255,0.08)"
      role: "top-level page sections, shell, dock, dialogs"
    card:
      bg: "rgba(18, 33, 42, 0.45)"
      blur: "20px saturate(150%)"
      border: "1px rgba(255,255,255,0.06)"
      role: "default card — metric cards, tables, lists"
    nested:
      bg: "rgba(255,255,255,0.04)"
      blur: "none"
      border: "1px rgba(255,255,255,0.05)"
      role: "inside a card/panel — table cells, inset wells"
    interactive:
      hover_border: "rgba(236,189,164,0.18)"
      role: "cards/rows that are clickable"

  status_tones:
    good: { color: secondary, border: "border-secondary/30 bg-secondary/10", meaning: "connected, healthy, success, positive delta" }
    warn: { color: primary, border: "border-primary/30 bg-primary/10", meaning: "pending, low inventory, attention needed" }
    info: { color: tertiary, border: "border-tertiary/30 bg-tertiary/10", meaning: "neutral data, informational, default" }
    bad: { color: error, border: "border-error/30 bg-error/10", meaning: "error, failed, high risk, destructive" }
    idle: { color: on_surface_variant, border: "border-outline-variant/30 bg-surface-container-high/40", meaning: "disabled, off, not yet started" }
---

# GarrettOS Design System

This is the design contract for every screen an AI agent or human writes in this repo.
Stitch project `12895490246031623746` is the visual source of truth. The tokens above
are already implemented in `app/globals.css` and `lib/design-system.ts`; the prose below
tells you **when** to use each one. Read both before generating UI.

## 1. Product identity

GarrettOS is a **calm operator console** for a personal OS. It aggregates agents, memory,
biometrics, revenue, and systems into one dark glass workspace. The user reads dense
screens for hours, so the UI must feel like a precision instrument: legible, quiet,
and never flashy.

- **Not** a consumer app. **Not** cyberpunk. **Not** a glitch/terminalpunk aesthetic.
- **Not** Linear-clone light mode. We are dark-first and stay dark.
- Inspiration: an avionics EICAS display rendered in warm sand glass — information-dense
  but visually calm.

If a generated screen feels exciting, loud, or demo-y, it is wrong. If it feels like a
tool you would leave open all day, it is right.

## 2. Visual language

- **Dark glass everywhere.** Every elevated surface is a translucent glass panel over the
  radial-gradient background. Solid opaque cards are not allowed above the page background.
- **Sand is the only brand accent.** `primary` (#ecbda4 warm sand) carries active state,
  links, brand marks, and the single highlight on a chart. Do not introduce a second brand hue.
- **Sage = good, steel = info, sand = warn, red = bad.** Status is encoded with tone, never
  with raw hex. Always go through the `status_tones` map or the `StatusChip` component.
- **Mono for data.** Numbers, ids, latencies, env vars, log lines, and timestamps use Geist
  Mono with `tabular-nums` so columns align.
- **Label-caps eyebrows.** Every section, table column, and status chip starts with an
  11px uppercase tracked label (`label-caps`). This is the dominant typographic texture.
- **Milled borders.** Glass surfaces use a 1px light top/left border + dark bottom/right
  border to read as machined, not printed.

## 3. Colors — usage rules

| Role | Token | When to use | When NOT to use |
|---|---|---|---|
| Brand / active / link | `primary` (sand) | active nav, links, the one highlighted chart bar, primary buttons, "warn" status | do not paint large areas with sand; it is an accent |
| Positive / success / healthy | `secondary` (sage) | "good" status chips, success pips, positive deltas | not for general UI chrome |
| Neutral data / info | `tertiary` (steel) | "info" chips, secondary chart series, neutral metrics | not for text body |
| Primary text | `on-surface` | headlines, values, list titles | — |
| Secondary text | `on-surface-variant` | descriptions, helper text | not for emphasis |
| Muted labels / captions | `outline` | label-caps eyebrows, timestamps, "x left" counts | not for primary content |
| Error / destructive | `error` | "bad" status, destructive buttons, error borders | never as a decorative color |
| Surfaces | `surface-container` family | card bodies, hover states, table headers | pick the right tier — do not hardcode `#12212a` |

**Forbidden colors:** cyan, violet, green, amber, red, sand, sage, steel as raw class
names. These legacy aliases exist in `globals.css` only for gradual migration. New code
MUST use `primary/secondary/tertiary/error`. Never introduce a new hex.

## 4. Typography — usage rules

- **`label-caps`** is the default eyebrow. Use it on section labels, table headers, status
  chip text, and any "field label" above a value. Always uppercase, always tracked.
- **`body-sm`** is the default body size in dense UI (tables, lists, cards). **`body-lg`**
  is for primary list items and card titles.
- **`headline-md`** for section/card titles. **`headline-lg`** for the single page title
  (one per route).
- **`display`** metric size is reserved for hero metric numbers only — never for words.
- **Numbers always `tabular-nums`** and, for ids/latencies/timestamps, `font-mono`.
- **Do not** introduce Inter, system-ui, or any other sans family. Geist is the only sans.
- **Do not** use weights below 400 or above 700. The scale is 400 body / 600 headings & labels / 700 display.

## 5. Spacing & layout

- **`gutter` (1rem)** is the universal gap between cards and grid columns. Use `gap-gutter`.
- **Page padding:** `px-margin-mobile` (< md) → `px-margin-desktop` (>= md). Bottom padding
  is always `pb-dock-safe` so content clears the floating dock.
- **Page max width** is `max-w-max-width` (1600px). Content centers within it.
- **Shell offsets:** content lives below a `h-topbar` (64px) fixed bar and to the right of a
  `w-sidebar` (264px) rail on desktop. Use `pt-topbar md:ml-sidebar`.
- **Grids:** prefer `grid gap-gutter` with explicit responsive column counts
  (`grid-cols-2 md:grid-cols-4`, `lg:grid-cols-3`, etc.). The legacy `os-bento` 12-col
  class exists but explicit grids are preferred for new pages.
- **Inside a card:** padding is `p-4 md:p-5`. Compact cards use `p-3`. Do not use `p-6`+.

## 6. Glass surfaces — usage rules

| Variant | Class | Use for |
|---|---|---|
| `panel` | `glass-panel milled-border` | top-level page sections, the shell, dock, dialogs, terminal overlay |
| `card` | `glass-card` | default — metric cards, tables, lists, context cards |
| `nested` | `glass-nested` | elements inside a card — table cells, inset code wells, sub-lists |
| `interactive` | `glass-interactive` | add to any card/row the user can click — hover lifts border to sand |

**Always** use the `GlassPanel` component (`variant="panel|card|nested"`, `interactive`)
instead of hand-writing the blur/border CSS. The component is the single source of truth
for glass. Never inline `backdrop-filter` in a page.

**Never** stack three glass layers (panel > card > nested > nested). Two levels max inside
a panel; if you need a third, flatten to a bordered div without blur.

## 7. Motion rules

Motion is **subtle and premium**. The system should feel like it is breathing, not performing.

### Springs (Framer Motion)
- **`springs.default`** — layout animations, active indicators (`layoutId`).
- **`springs.soft`** — scroll reveals, stagger items, list entrances.
- **`springs.palette`** — overlays, dialogs, command palette.
- **`springs.dock`** — dock item hover/tap magnetic effect (the only place overshoot is allowed).

### Fades
- `fades.fast` (150ms) — hover states, chip toggles.
- `fades.normal` (250ms) — default content transitions.
- `fades.slow` (400ms) — page-level reveals, hero entrances.

### Patterns that are encouraged
- `ScrollReveal` + `StaggerReveal`/`StaggerItem` for any list or grid entering the viewport.
- `layoutId` for shared active indicators (nav, settings tabs, dock).
- `AnimatedCounter` for metric numbers counting up on reveal.
- `BreathingPip` for live status (3s ease-in-out pulse) — never faster.
- `scaleIn` for dialogs/overlays; `slideUp` for cards.
- Stroke-draw animation for `Sparkline` paths.

### Reduced motion — mandatory
- Every animated component MUST call `useReducedMotion()` and collapse to `{ duration: 0 }`
  when true. The `motionSafe()` helper in `lib/motion.ts` does this.
- `ScrollReveal`/`StaggerReveal` already handle this. If you hand-roll motion, you must too.
- The `.breathing-pip` CSS animation is disabled under `prefers-reduced-motion`.

### Animation DO / DON'T

**DO**
- Animate opacity and y (6-12px) for entrances.
- Use `viewport={{ once: true }}` on scroll reveals — never re-trigger on scroll back.
- Stagger children 0.04-0.05s.
- Use `layoutId` for the active nav pill so it slides between items.
- Cap loop animations at the 3s breathe tempo.
- Keep dialog/overlay scale change to 0.96 → 1.

**DON'T**
- No glitch, scanline-flicker, or CRT effects (the terminal overlay uses a heartbeat cursor,
  not a scanline animation).
- No neon glow pulsing faster than 3s.
- No parallax on scroll.
- No spring bounce/overshoot except the dock magnetic effect.
- No full-page spinner; use `ThinkingLoader` dots or `CodeLineLoader` lines inline.
- No auto-playing carousels or marquee tickers.
- No 3D card tilts or mouse-tracked parallax on cards (the login glow is the one exception
  and is scoped to that single component).
- Do not animate `width`/`height` of large containers; animate `transform`/`opacity`.

## 8. Component rules

All shared components live in `components/garrettos/` and are exported from
`components/garrettos/index.ts`. **Reuse before creating.** If a need is covered by an
existing component, do not write a new one.

### Layout & navigation
- **`Shell`** — wraps every dashboard route. Provides `TopAppBar`, `SideNavBar`,
  `CommandDock`, and the `CommandPaletteProvider`. Pages render inside it.
- **`TopAppBar`** — fixed 64px bar with wordmark, `CommandInput` trigger, telemetry chips,
  agent status, notifications. Collapses on mobile.
- **`SideNavBar`** / **`SideNavDrawer`** — desktop rail + mobile off-canvas. Active item
  uses `layoutId` sand pill. Nav config lives in `lib/nav-config.ts`.
- **`CommandDock`** — floating glass dock with magnetic hover (`dockItem` variants) and a
  FAB that opens the command palette.
- **`CommandPalette`** — `⌘K` overlay with grouped results (Navigate / Quick Actions /
  Recent), keyboard nav, `scaleIn` open. Controlled via `useCommandPaletteContext()`.

### Surfaces & content
- **`GlassPanel`** — `variant="panel|card|nested"`, `interactive`. Always use this for glass.
- **`MetricCard`** — variants: `hero`, `compact`, `sparkline`, `progress`, `dual`, `alert`.
  Accepts `AnimatedCounter` as `value`. Use `progress` for gauges, `alert` for warning cards.
- **`StatusChip`** — `tone="good|warn|info|bad|idle"`, `showPip`, `size="inline"`. The only
  way to render status. Never hand-color a status label.
- **`BreathingPip`** — live status dot. `tone` + `pulse`. Use for "running"/"live" only.
- **`SectionHeader`** / **`SectionHeaderCompact`** — page title block and in-card titles.
  `eyebrow` is a label-caps line; `title` is headline-lg / headline-md.
- **`GarrettIcon`** — wraps Material Symbols Outlined. Pass `name`, `size`, `fill`,
  `className`. Do not inline `<span class="material-symbols">` directly.

### Data display
- **`Sparkline`** / **`SparklinePath`** — animated stroke-draw SVG sparkline. `color` takes
  `primary|secondary|tertiary`.
- **`MiniChart`** — bar chart with Stitch-aligned bar colors.
- **`RevenueChart`** / **`RevenueSummary`** — bar chart with animated bars + total/delta.
- **`AnimatedCounter`** / **`MetricCounter`** — ease-out count-up. Wrap metric numbers in it.
- **`SystemTopology`**, **`AgentGraph`**, **`MemoryTimeline`**, **`EventStream`**,
  **`TaskQueue`** — domain-specific data views. Prefer these over ad-hoc lists.
- **`LogStream`** / **`LogFilterBar`** / **`TerminalOverlay`** — system logs + terminal.

### Feedback & states
- **`EmptyState`** — icon + title + description + optional action. Use whenever a list/table
  can be empty. Never render a bare "No data" string.
- **`Skeleton`** / `MetricSkeleton` / `TableSkeleton` / `CardSkeleton` — shimmer loaders.
  Use for any async-loaded card/table.
- **`ThinkingLoader`** / **`CodeLineLoader`** — inline "thinking" dots and "generating" lines.
  Use instead of full-page spinners.
- **`TelemetryChip`** — small icon+value chip (CPU/MEM/LAT). For top bar and system pages.

### Overlays & drawers
- **`CommandPalette`** — see above.
- **`ApprovalDialog`** — agent action approval modal with risk badges + stagger fields.
- **`AgentDrawer`** — right-sheet agent config (model / prompt / temperature slider).
- **`TerminalOverlay`** — terminal modal with heartbeat cursor.
- **`AssistantPanel`** — chat interface with `onSend`, `title`, `subtitle`. The basis for
  `/mentor` and any assistant surface.

### Settings & forms
- **`SettingsShell`** — sidebar nav + content. Active tab uses `layoutId`.
- **`ApiKeyCard`** / **`ApiKeyGroup`** — integration cards with masked key + copy state.
- **`SecurityAlert`** — error-toned alert banner.

### Rules for building new components
1. Check `components/garrettos/index.ts` first. Reuse.
2. New components go in `components/garrettos/` and are exported from `index.ts`.
3. Use `GlassPanel` for any elevated surface — never inline glass CSS.
4. Use `StatusChip` for any status — never hand-color.
5. Use `GarrettIcon` for any icon — never raw Material Symbols markup.
6. Add `'use client'` only if the component uses hooks/motion; keep server components default.
7. Every interactive element needs a visible focus state and an `aria-label` if icon-only.
8. Every animated component must respect `useReducedMotion`.

## 9. Page layout principles

1. **One `SectionHeader` per route** (eyebrow + headline-lg title + description + optional
   action). It is the page title.
2. **Hero metric row first** — 2-4 `MetricCard variant="hero"` in a `StaggerReveal` grid.
   This is the default opening of every dashboard page.
3. **Then a 2- or 3-column grid** (`grid gap-gutter lg:grid-cols-3`) with the primary content
   spanning 2 columns and context/secondary content in the right rail.
4. **Tables in `GlassPanel variant="card"`** with `label-caps` headers, `border-white/5` row
   dividers, `hover:bg-white/[0.02]` row hover, and `last:border-0`.
5. **Wrap every major block in `ScrollReveal`**; wrap lists/grids in `StaggerReveal`.
6. **Bottom padding `pb-dock-safe`** so the floating dock never covers content.
7. **Responsive:** every grid must have a mobile (1-2 col) and desktop (3-4 col) breakpoint.
   The sidebar collapses to a drawer below `lg`; the top bar collapses below `md`.
8. **Density:** aim for high information density without crowding. A page should show
   4-8 distinct data regions above the fold on desktop. Whitespace comes from gutters and
   padding, not from empty hero zones.

### Standard page skeleton

```
<SectionHeader eyebrow title description action />
<StaggerReveal className="grid ... md:grid-cols-4"> hero metrics </StaggerReveal>
<div className="grid gap-gutter lg:grid-cols-3">
  <ScrollReveal className="lg:col-span-2"> primary </ScrollReveal>
  <ScrollReveal delay={0.05}> context rail </ScrollReveal>
</div>
<ScrollReveal> full-width table or chart </ScrollReveal>
```

## 10. React Bits / Motion Primitives usage rules

The repo uses **Framer Motion** as the motion engine. "React Bits" and "Motion Primitives"
refer to the two motion styles we use, not external packages.

### React Bits style (component-encapsulated motion)
Use for self-contained animated components with internal state:
- `AnimatedCounter` — count-up on reveal.
- `BreathingPip` — CSS keyframe pulse.
- `ThinkingLoader` / `CodeLineLoader` — inline loading.
- `LoginGlassPanel` mouse-reactive glow — the ONLY mouse-tracked effect in the app.

**Rule:** React-Bits-style components must be reusable and self-contained. They own their
motion and expose props, not animation internals. Do not scatter `motion.*` calls across
page code when a component will do.

### Motion Primitives style (layout/scene motion)
Use for scene-level and layout motion via Framer Motion variants:
- `ScrollReveal` / `StaggerReveal` / `StaggerItem` — viewport-triggered variants.
- `layoutId` shared-element transitions (nav pill, settings tab, dock indicator).
- `scaleIn` / `slideUp` / `fadeIn` variants for overlays and card entrances.
- `springs.*` presets for any spring-driven transition.

**Rule:** Prefer variants + presets from `lib/motion.ts` over inline transitions. If you
find yourself writing `{ type: 'spring', stiffness: ... }` in a page, move it to `lib/motion.ts`.

### When to use which
- **Component animates itself** → React Bits style (encapsulate in a component).
- **Component animates with siblings on scroll/open** → Motion Primitives (variants).
- **Shared element moves between containers** → Motion Primitives (`layoutId`).
- **You are writing motion in a page file** → Stop. Extract a component or use a preset.

## 11. Examples of good GarrettOS UI

### Good: `/memory` Neural Index
- One `SectionHeader` with eyebrow "Memory".
- 4 `MetricCard variant="compact"` in a `StaggerReveal` hero row (chunks, sources, decisions, last sync).
- Search input in a `GlassPanel variant="card"` with a `GarrettIcon name="search"` prefix.
- 7/5 split: `ScrollReveal` table (title/tags/chunks/relevance) + detail preview panel.
- Table uses `label-caps` headers, `hover:bg-white/[0.02]`, `last:border-0`, `tabular-nums`.
- Selected row highlighted with `bg-primary/8`.
- Below: 3-col grid of timeline, decisions, todos — each in `ScrollReveal`.
- Empty state uses `EmptyState` component, not a bare string.

### Good: `/system` logs
- `LogStream` with `LIVE` breathing pip, `label-caps` level chips, mono font, `scroll-hide`.
- `LogFilterBar` as a pill segment control with `aria-pressed`.
- `TerminalOverlay` opens on a button; uses `scaleIn` + heartbeat cursor, closes on backdrop.
- Model routing matrix uses progress bars (`h-1 rounded-full bg-primary`) inside table cells.

### Good: `/openclaw` agent grid
- Grid/table toggle as a pill segmented control, `aria-pressed`, sand active state.
- `AgentGraph` cards show `BreathingPip` + load bar + `StatusChip`.
- Approvals are clickable rows opening `ApprovalDialog` with staggered fields and risk badges.
- `AgentDrawer` slides from right with `springs.soft`, has model select + prompt + temperature.

### Good: `/mentor`
- `AssistantPanel` takes 2/3 width with `onSend`, `title`, `subtitle`.
- Right rail: 5 `GlassPanel variant="card" interactive` context cards, each with icon +
  `StatusChip` pip, staggered in.
- Provider selector is a native `<select>` styled to match — no custom dropdown chrome.

## 12. Examples of bad GarrettOS UI

### Bad: hardcoded colors
```tsx
// WRONG — legacy aliases, no semantic meaning
<span className="text-cyan-400 font-bold">12ms</span>
<div className="bg-green-500/20 border border-green-500/40">Healthy</div>
```
```tsx
// RIGHT
<span className="font-mono tabular-nums text-tertiary">12ms</span>
<StatusChip label="Healthy" tone="good" showPip />
```

### Bad: inline glass CSS
```tsx
// WRONG — bypasses GlassPanel, will drift from tokens
<div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-6">
```
```tsx
// RIGHT
<GlassPanel variant="card" className="p-4 md:p-5"> ... </GlassPanel>
```

### Bad: raw Material Symbols markup
```tsx
// WRONG — no size/fill control, no a11y
<span className="material-symbols-outlined">home</span>
```
```tsx
// RIGHT
<GarrettIcon name="home" size={20} />
```

### Bad: flashy motion
```tsx
// WRONG — glitch flicker, neon pulse, not GarrettOS
<motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.3, repeat: Infinity }} />
<motion.h1 initial={{ y: -40, rotate: -5 }} animate={{ y: 0, rotate: 0 }} />
```
```tsx
// RIGHT — calm reveal, reduced-motion aware
<ScrollReveal> <h1>...</h1> </ScrollReveal>
```

### Bad: ignoring reduced motion
```tsx
// WRONG — will motion-sickness users
<motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity }} />
```
```tsx
// RIGHT
const reduce = useReducedMotion();
<motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
```

### Bad: empty states & loading
```tsx
// WRONG — bare strings, no skeleton
{rows.length === 0 ? <p>No data</p> : <Table />}
{loading ? <div className="spinner" /> : <Content />}
```
```tsx
// RIGHT
{rows.length === 0 ? <EmptyState icon="search" title="No results" /> : <Table />}
{loading ? <TableSkeleton /> : <Content />}
```

### Bad: status without StatusChip
```tsx
// WRONG — hand-colored, no pip, no consistency
<span className="text-red-400">Error</span>
<span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full">Pending</span>
```
```tsx
// RIGHT
<StatusChip label="Error" tone="bad" showPip />
<StatusChip label="Pending" tone="warn" showPip />
```

### Bad: page structure
- A route with no `SectionHeader` (no page title).
- A hero zone that is 60vh of empty space above one card.
- A 12-column bento with no responsive collapse (breaks on mobile).
- Content that runs under the dock because `pb-dock-safe` was omitted.
- Two `headline-lg` titles on one page.

## 13. Accessibility — non-negotiable

- **Focus states:** every interactive element must show a visible focus ring. Use
  `focus:outline-none focus:ring-1 focus:ring-primary/30` on custom controls.
- **Icon-only buttons:** must have `aria-label`.
- **Switches/toggles:** `role="switch"`, `aria-checked`.
- **Dialogs/overlays:** `role="dialog"`, `aria-modal="true"`, backdrop closes on click/Esc,
  focus is trapped or returned.
- **Logs/live data:** `role="log"`, `aria-live="polite"` (or `off` when not live).
- **Tables:** real `<table>`/`<thead>`/`<tbody>`, `label-caps` headers, not div grids for
  tabular data.
- **Color is not the only signal:** status always has a text label + pip, not just a color.
- **Reduced motion:** see §7 — mandatory for every animated component.
- **Contrast:** sand-on-dark and on-surface-on-dark meet WCAG AA at the sizes used. Do not
  drop body text below `text-body-sm` (14px) or below `text-outline` for primary content.

## 14. What NOT to introduce

- No new brand colors. Sand is the only accent.
- No new font families. Geist Sans + Geist Mono only.
- No light mode. The app is dark-first and stays dark.
- No glassmorphism "frosted white" cards on light backgrounds.
- No TailwindUI/shadcn default styling that conflicts with the tokens (e.g. `bg-zinc-900`).
  The shadcn primitives in `components/ui/` are mapped to our tokens in `globals.css`;
  prefer `components/garrettos/` primitives where they exist.
- No emoji as UI icons. Use `GarrettIcon` (Material Symbols).
- No third-party animation libraries besides Framer Motion.
- No autoplay video, carousels, or marquees.
- No customer-facing "marketing" language in the dashboard — it is an operator tool.

## 15. Living Motion System

The base motion rules in §7 cover calm reveals and reduced-motion. This section
extends them with the **living motion layer** added in M6 — the ambient,
reactive, and tactile behaviors that make GarrettOS feel alive without becoming
cyberpunk, glitchy, or distracting. All living motion lives in
`components/garrettos/motion/` and is governed by `MotionProvider`.

### When motion is ALLOWED

- **Ambient:** one subtle radial light following the cursor across the viewport
  (`AmbientMouseField`), and per-surface mouse-aware highlights on hero/interactive
  glass (`FluidGlassPanel`, `ReactiveGlassSurface`). One global ambient field, not many.
- **Living metrics:** numbers count up on reveal (`AnimatedCounter`), and live/active
  values breathe a faint sand glow (`LiveMetric`, `PulseNumber`). Idle/stale values stay calm.
- **Tactile interactions:** buttons magnetic-pull toward the cursor a few px
  (`MagneticButton`), the dock active indicator morphs between items
  (`MorphingDockIndicator`), the FAB has a soft idle ring (`DockFab`).
- **Overlays:** command palette opens/closes with blur + scale + opacity
  (`CommandPaletteKinetics`); recent commands stagger in; the active highlight
  morphs between rows (`PaletteActiveHighlight`).
- **Agent/loading states:** `AgentThinkingOrb` (concentric breathing rings),
  `LoadingConstellation` (drifting dots for syncing), `CodeGenerationStream`
  (lines stream in with a caret). Use these instead of full-page spinners.
- **Scroll choreography:** sections reveal via `ScrollReveal` / `StaggerReveal`;
  lists/timelines/queues use `StaggeredMotionList` so items rise in as a group.
- **Route transitions:** subtle fade + small y-slide between pages
  (`RouteTransition`), never layout-breaking.

### When motion is FORBIDDEN

- **No** glitch, scanline-flicker, or CRT effects.
- **No** neon glow pulsing faster than the 3s breathe tempo.
- **No** 3D card tilts or mouse-tracked parallax on content (the login panel's
  mouse-reactive glow is the single scoped exception).
- **No** scroll-jacking — reveals trigger via `useInView`, never hijack scroll position.
- **No** full-page spinners — use `AgentThinkingOrb` / `LoadingConstellation` /
  `CodeGenerationStream` / `ThinkingLoader` inline instead.
- **No** animating everything at once — stagger, do not waterfall entire long pages.
- **No** animating `width`/`height` of large containers; animate `transform`/`opacity`.
- **No** spring overshoot/bounce except the dock magnetic effect (`springs.dock`).
- **No** re-triggering scroll reveals on scroll-back — `once: true` by default.
- **No** motion on stale/idle status — calm by default; only live/active breathes.
- **No** one-off page-level `motion.*` calls when a motion/ component exists.

### React Bits usage rules

React-Bits-style = **self-contained animated components that own their motion**
and expose props, not animation internals. In this repo these live in `motion/`:

- `AnimatedCounter` — count-up on reveal. Wrap metric numbers in it.
- `LiveMetric` / `PulseNumber` — living values with breathing glow / ticking.
- `BreathingPip` — CSS keyframe pulse for live status.
- `AgentThinkingOrb` / `LoadingConstellation` / `CodeGenerationStream` — ambient loaders.
- `MagneticButton` — magnetic-pull button.
- `MorphingDockIndicator` / `DockFab` — dock indicator + FAB.

**Rules:**
1. Prefer a React-Bits component over hand-rolling `motion.*` in a page.
2. These components must be reusable and accept props for label/size/tone — never
   hardcode the surrounding context.
3. They must internally call `useReducedMotion()` / `useMotionPreferences()` and disable
   their motion under reduced motion. Do not push that responsibility to the caller.
4. Do not expose animation internals (variants, transitions) as props; expose behavior
   (`liveness`, `size`, `label`, `strength`).

### Motion Primitives usage rules

Motion-Primitives-style = **scene-level and layout motion via shared variants** from
`lib/motion.ts` and `lib/living-motion.ts`:

- `ScrollReveal` / `StaggerReveal` / `StaggerItem` — viewport-triggered reveals.
- `StaggeredMotionList` — list/grid choreography with direction (`up`/`down`/`left`/`right`/`fade`).
- `RouteTransition` — page fade/slide on pathname change.
- `CommandPaletteKinetics` + `PaletteStaggerList`/`PaletteStaggerItem`/`PaletteActiveHighlight` — palette motion.
- `layoutId` shared-element transitions (nav pill, dock indicator, settings tab, palette highlight).
- `springs.*` presets and the `paletteStagger` / `routeVariants` / `orbBreath` variants.

**Rules:**
1. Use variants + presets from `lib/motion.ts` / `lib/living-motion.ts`. If you write
   `{ type: 'spring', stiffness: ... }` in a page, move it to a presets file.
2. `layoutId` is the tool for shared-element transitions (active pill sliding between
   items). Keep layoutIds unique per surface.
3. Reveal wrappers must use `once: true` by default and `useInView` (not scroll-jacking).
4. Stagger children 0.04–0.06s; cap total delay so long lists don't waterfall.
5. Reduced motion must collapse variants to instant — the `motion/` wrappers handle this.

### Reduced-motion behavior (mandatory)

- `MotionProvider` resolves a `mode`: `full` | `reduced` | `minimal`.
  - `reduced` = OS `prefers-reduced-motion` is on.
  - `minimal` = user-forced via `localStorage['garrettos-motion'] === 'minimal'`.
- Under `reduced`: ambient field off, magnetic off, route transitions off, orb/constellation
  static, counters jump to final value, no stagger movement (opacity-only or instant).
- Under `minimal`: ambient + magnetic off (calmer), but reveals/counters still animate gently.
- Every living-motion component reads `useMotionPreferences()` (or `useReducedMotion()`)
  and disables its non-essential motion. The variant-bearing CSS `.breathing-pip` is also
  disabled under `prefers-reduced-motion` in `globals.css`.
- Static variants (active/warning/danger borders, status colors) remain — they are not motion.

### Examples of good GarrettOS motion

- **Home hero metrics** count up when scrolled into view; the active one breathes a sand glow.
- **Command dock** active pill morphs between items via `layoutId`; icons magnetic-hover;
  FAB has a soft idle ring.
- **Command palette** opens with blur+scale, recent commands stagger in, the sand highlight
  slides between rows as you arrow up/down.
- **`/memory` neural index** rows stagger in from the bottom; the selected row's sand tint
  morphs between selections.
- **`/system` log stream** shows a `LIVE` breathing pip; terminal overlay opens with `scaleIn`
  and a heartbeat cursor (not a scanline).
- **`/openclaw` approval dialog** fields stagger in; the agent drawer slides from the right
  with `springs.soft`.
- **Login** panel has a mouse-reactive sand glow + the submit button magnetic-pulls; the
  "entering" loading screen uses `LoadingConstellation`.

### Examples of bad GarrettOS motion

- A card that tilts in 3D toward the cursor — forbidden (only the login glow is scoped).
- A "live" CPU number that counts up every second — distracting; use `PulseNumber` with a
  cross-fade, not a full recount.
- A full-page spinner while agents run — use `AgentThinkingOrb` inline instead.
- Every section on a long page animating in one giant waterfall — stagger per section,
  respect viewport, use `once: true`.
- A neon pulse at 0.5s tempo — stay at the 3s breathe tempo.
- Hand-written `motion.div` with inline spring config in a page file — extract a component
  or use a preset.
- Re-triggering a reveal every time you scroll past it — set `once: true`.
- Animating a container's `width` on hover — animate `transform`/`opacity` instead.

## 16. Maintenance

- **Source of truth:** Stitch project `12895490246031623746`. If Stitch tokens change,
  update `app/globals.css` `@theme` block + the YAML front matter here together.
- **Implementation mirrors:** `lib/design-system.ts` (TS token maps), `lib/motion.ts`
  (motion presets), `lib/living-motion.ts` (living-motion presets), `lib/nav-config.ts`
  (nav), `components/garrettos/motion/` (M6 living-motion components). Keep these in
  sync with this file.
- **When adding a component:** add it to `components/garrettos/index.ts`, document its
  props and when-to-use in §8, and add a good/bad example if it replaces a common
  anti-pattern.
- **When in doubt:** open a Stitch screen for the relevant route and match it. Stitch is
  the visual source of truth; this file is the written contract that makes Stitch legible
  to agents.
