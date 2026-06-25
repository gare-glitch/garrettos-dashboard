/** GarrettOS design system — Stitch-aligned tokens (project 12895490246031623746) */

/** Semantic color class maps for status / tone */
export const colors = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  onSurface: 'text-on-surface',
  onSurfaceVariant: 'text-on-surface-variant',
  outline: 'text-outline',
  error: 'text-error',
} as const;

export const typography = {
  /** 11px uppercase label — Stitch label-caps */
  labelCaps: 'label-caps text-outline',
  /** Legacy eyebrow — maps to label-caps with primary accent option */
  eyebrow: 'label-caps text-outline',
  eyebrowPrimary: 'label-caps text-primary',
  title: 'text-headline-md font-semibold tracking-tight text-on-surface',
  headline: 'text-headline-lg font-semibold tracking-tight text-on-surface',
  headlineMd: 'text-headline-md font-semibold text-on-surface',
  body: 'text-body-sm text-on-surface-variant',
  bodySm: 'text-body-sm text-on-surface',
  bodyLg: 'text-body-lg text-on-surface',
  mono: 'font-mono text-body-code text-on-surface-variant',
  code: 'font-mono text-body-code',
  metric: 'text-display-metric tabular-nums text-on-surface',
  metricMd: 'text-headline-lg tabular-nums text-on-surface',
} as const;

export const spacing = {
  page: 'space-y-gutter md:space-y-6',
  section: 'space-y-3',
  dense: 'gap-2',
  grid: 'gap-gutter',
  gutter: 'gap-gutter',
  marginDesktop: 'px-margin-desktop',
  marginMobile: 'px-margin-mobile',
  dockSafe: 'pb-dock-safe',
  sidebarOffset: 'md:ml-sidebar',
  topbarOffset: 'pt-topbar',
} as const;

export const layout = {
  maxWidth: 'max-w-max-width',
  sidebarWidth: 'w-sidebar',
  topbarHeight: 'h-topbar',
  dockHeight: 'h-dock',
} as const;

export const surfaces = {
  panel: 'glass-panel milled-border rounded-xl',
  card: 'glass-card rounded-xl',
  nested: 'glass-nested rounded-lg',
  interactive: 'glass-interactive',
} as const;

export const motion = {
  spring: { type: 'spring' as const, stiffness: 420, damping: 34 },
  springSoft: { type: 'spring' as const, stiffness: 260, damping: 28 },
  springDock: { type: 'spring' as const, stiffness: 380, damping: 28 },
  fade: { duration: 0.2 },
  fadeSlow: { duration: 0.35 },
  stagger: 0.04,
  staggerChildren: 0.05,
} as const;

/** Status tone → Tailwind classes (Stitch palette) */
export const statusColors = {
  good: 'text-secondary',
  warn: 'text-primary',
  info: 'text-tertiary',
  bad: 'text-error',
  idle: 'text-on-surface-variant',
} as const;

export const statusBorders = {
  good: 'border-secondary/30 bg-secondary/10',
  warn: 'border-primary/30 bg-primary/10',
  info: 'border-tertiary/30 bg-tertiary/10',
  bad: 'border-error/30 bg-error/10',
  idle: 'border-outline-variant/30 bg-surface-container-high/40',
} as const;

/** Stitch raw hex — for SVG / canvas when CSS vars unavailable */
export const stitchPalette = {
  primary: '#ecbda4',
  secondary: '#b9cda4',
  tertiary: '#b8c8da',
  surface: '#06151e',
  onSurface: '#d5e5f1',
  outline: '#889295',
  error: '#ffb4ab',
} as const;
