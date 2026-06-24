import type { NavItem } from '@/data/mock';
import type { MaterialSymbol } from '@/components/garrettos/GarrettIcon';

export const navIconMap: Record<NavItem['icon'], MaterialSymbol> = {
  home: 'dashboard',
  health: 'ecg_heart',
  gym: 'fitness_center',
  water: 'water_drop',
  mentor: 'auto_awesome',
  openclaw: 'smart_toy',
  memory: 'psychology',
  system: 'terminal',
  projects: 'analytics',
  settings: 'settings',
};

/** Primary rail items (shown first in sidebar) */
export const primaryNavHrefs = ['/', '/openclaw', '/memory', '/mentor', '/system'] as const;

/** Secondary rail items */
export const secondaryNavHrefs = ['/health', '/gym', '/water', '/projects'] as const;
