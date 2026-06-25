export { Shell } from './Shell';
export { GlassPanel } from './GlassPanel';
export { MetricCard } from './MetricCard';
export type { MetricCardProps } from './MetricCard';
export { StatusChip } from './StatusChip';
export { CommandDock } from './CommandDock';
export { TopAppBar } from './TopAppBar';
export { SideNavBar, SideNavDrawer } from './SideNavBar';
export { CommandPalette, CommandPaletteOverlay, CommandPaletteTrigger, useCommandPalette, useCommandPaletteContext, CommandPaletteProvider } from './CommandPalette';
export { EventStream } from './EventStream';
export { TaskQueue } from './TaskQueue';
export { MemoryTimeline } from './MemoryTimeline';
export { AgentGraph } from './AgentGraph';
export { SystemTopology } from './SystemTopology';
export { MiniChart } from './MiniChart';
export { Sparkline, SparklinePath } from './Sparkline';
export { RevenueChart, RevenueSummary } from './RevenueChart';
export { SectionHeader, SectionHeaderCompact } from './SectionHeader';
// Living-motion upgrades (M6) — re-exported from motion/ so all pages that
// import these from the barrel get the upgraded, MotionProvider-aware versions.
export { AnimatedCounter, MetricCounter } from './motion/AnimatedCounter';
export { GarrettIcon } from './GarrettIcon';
export type { MaterialSymbol } from './GarrettIcon';
export { BreathingPip } from './BreathingPip';
export { TelemetryChip } from './TelemetryChip';
export { CommandInput } from './CommandInput';
export { EmptyState } from './EmptyState';
export { Skeleton, MetricSkeleton, TableSkeleton, CardSkeleton } from './Skeleton';
export { ScrollReveal, StaggerReveal, StaggerItem } from './motion/ScrollReveal';
export { ThinkingLoader, CodeLineLoader } from './ThinkingLoader';
export { AssistantPanel } from './AssistantPanel';
export type { AssistantMessage } from './AssistantPanel';
export { HomeHero } from './HomeHero';
export { SettingsShell } from './SettingsShell';
export { ApiKeyCard, ApiKeyGroup, SecurityAlert } from './ApiKeyCard';
export type { ApiKeyCardProps } from './ApiKeyCard';
export { LogStream, LogFilterBar, TerminalOverlay } from './LogStream';
export type { LogEntry, LogLevel } from './LogStream';
export { ApprovalDialog, AgentFleetTable, AgentDrawer } from './AgentOps';
export type { Approval, AgentFleetRow, AgentConfig } from './AgentOps';
export { CommandWorkspace } from './CommandWorkspace';
export { AppLoadingScreen, SyncingMemoryLoader, LoginLoadingState } from './auth/AppLoadingScreen';
export { LoginGlassPanel, GarrettOSMark, LoginForm } from './auth/LoginExperience';
// Living motion system (M6)
export {
  MotionProvider,
  useMotionPreferences,
  AmbientMouseField,
  RouteTransition,
  ReactiveGlassSurface,
  FluidGlassPanel,
  LiveMetric,
  PulseNumber,
  MagneticButton,
  MorphingDockIndicator,
  DockFab,
  CommandPaletteKinetics,
  PaletteStaggerList,
  PaletteStaggerItem,
  PaletteActiveHighlight,
  AgentThinkingOrb,
  LoadingConstellation,
  CodeGenerationStream,
  StaggeredMotionList,
  MotionListItem,
} from './motion';
export type * from './types';
