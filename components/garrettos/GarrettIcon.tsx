import { cn } from '@/lib/utils';

export type MaterialSymbol =
  | 'dashboard'
  | 'hub'
  | 'smart_toy'
  | 'psychology'
  | 'memory'
  | 'terminal'
  | 'settings'
  | 'search'
  | 'notifications'
  | 'notifications_active'
  | 'person'
  | 'dns'
  | 'signal_cellular_alt'
  | 'sensors'
  | 'account_tree'
  | 'sync'
  | 'auto_graph'
  | 'database'
  | 'more_vert'
  | 'play_arrow'
  | 'ecg_heart'
  | 'support_agent'
  | 'settings_input_component'
  | 'folder_open'
  | 'add'
  | 'home'
  | 'science'
  | 'analytics'
  | 'folder_special'
  | 'arrow_upward'
  | 'auto_awesome'
  | 'bolt'
  | 'description'
  | 'cloud'
  | 'content_copy'
  | 'check'
  | 'lock'
  | 'key'
  | 'shield'
  | 'palette'
  | 'link'
  | 'link_off'
  | 'chevron_right'
  | 'chevron_left'
  | 'monitoring'
  | 'speed'
  | 'public'
  | 'robot_2'
  | 'dangerous'
  | 'restart_alt'
  | 'edit'
  | 'delete'
  | 'grid_view'
  | 'add_circle'
  | 'security'
  | 'sync_alt'
  | 'payments'
  | 'more_horiz'
  | 'warning'
  | 'photo_camera'
  | 'gpp_maybe'
  | 'rocket_launch'
  | 'fitness_center'
  | 'water_drop'
  | 'menu'
  | 'open_in_new'
  | 'storage'
  | 'table_rows'
  | 'terminal'
  | (string & {});

export function GarrettIcon({
  name,
  size = 20,
  weight = 400,
  fill = false,
  className,
  label,
}: {
  name: MaterialSymbol;
  size?: number;
  weight?: 300 | 400 | 500;
  fill?: boolean;
  className?: string;
  /** Accessible label when icon is standalone (not decorative) */
  label?: string;
}) {
  return (
    <span
      className={cn('material-symbols-outlined inline-flex leading-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
    </span>
  );
}
