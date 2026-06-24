'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { fadeIn } from '@/lib/motion';
import { GarrettIcon, type MaterialSymbol } from './GarrettIcon';

export function EmptyState({
  icon = 'database',
  title,
  description,
  action,
  compact,
  className,
}: {
  icon?: MaterialSymbol;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeIn}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-6' : 'gap-3 py-10',
        className,
      )}
      role="status"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-white/8 bg-surface-container-high/50">
        <GarrettIcon name={icon} size={24} className="text-outline" />
      </div>
      <div className="max-w-xs space-y-1">
        <p className={compact ? typography.title : typography.headlineMd}>{title}</p>
        {description ? <p className={typography.body}>{description}</p> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </motion.div>
  );
}
