// Living motion system — M6
// All components here are reusable. Read DESIGN.md §"Living Motion System"
// before using. Respect prefers-reduced-motion via MotionProvider.

export { MotionProvider, useMotionPreferences, type MotionMode } from './MotionProvider';
export { AmbientMouseField } from './AmbientMouseField';
export { RouteTransition } from './RouteTransition';
export { ReactiveGlassSurface } from './ReactiveGlassSurface';
export { FluidGlassPanel } from './FluidGlassPanel';
export { AnimatedCounter, MetricCounter } from './AnimatedCounter';
export { LiveMetric } from './LiveMetric';
export { PulseNumber } from './PulseNumber';
export { MagneticButton } from './MagneticButton';
export { MorphingDockIndicator, DockFab } from './MorphingDockIndicator';
export {
  CommandPaletteKinetics,
  PaletteStaggerList,
  PaletteStaggerItem,
  PaletteActiveHighlight,
} from './CommandPaletteKinetics';
export { AgentThinkingOrb } from './AgentThinkingOrb';
export { LoadingConstellation } from './LoadingConstellation';
export { CodeGenerationStream } from './CodeGenerationStream';
export { ScrollReveal, StaggerReveal, StaggerItem } from './ScrollReveal';
export { StaggeredMotionList, MotionListItem } from './StaggeredMotionList';
