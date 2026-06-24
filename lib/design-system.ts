/** GarrettOS design system constants — typography, spacing, motion */

export const typography = {
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan',
  title: 'text-lg font-semibold tracking-tight text-foreground',
  headline: 'text-2xl font-semibold tracking-tight md:text-3xl',
  body: 'text-sm text-muted-foreground',
  mono: 'font-mono text-xs',
  metric: 'text-3xl font-bold tracking-tight tabular-nums md:text-4xl',
} as const;

export const spacing = {
  page: 'space-y-4 md:space-y-5',
  section: 'space-y-3',
  dense: 'gap-2',
  grid: 'gap-3 md:gap-4',
} as const;

export const motion = {
  spring: { type: 'spring' as const, stiffness: 420, damping: 34 },
  springSoft: { type: 'spring' as const, stiffness: 260, damping: 28 },
  fade: { duration: 0.2 },
} as const;

export const statusColors = {
  good: 'text-green',
  warn: 'text-amber',
  info: 'text-cyan',
  bad: 'text-red',
  idle: 'text-muted-foreground',
} as const;
