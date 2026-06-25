'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { useMotionPreferences } from './MotionProvider';
import { codeLineReveal } from '@/lib/living-motion';

/**
 * CodeGenerationStream — a "generating code" indicator that streams fake code
 * lines into view, one at a time, with a soft caret.
 *
 * Use for: agent code generation, schema writing, refactoring tasks.
 * The lines are illustrative; pass your own to make it domain-specific.
 *
 * Reduced motion: lines appear without stagger; caret static.
 */
export function CodeGenerationStream({
  lines = DEFAULT_LINES,
  label = 'Generating code',
  className,
  speed = 280,
}: {
  lines?: string[];
  label?: string;
  className?: string;
  /** ms per line reveal */
  speed?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const animate = ambientEnabled && !reduceMotion;
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (!animate) {
      setVisible(lines.length);
      return;
    }
    const id = setInterval(() => {
      setVisible((v) => {
        if (v >= lines.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [lines, animate, speed]);

  return (
    <div className={cn('glass-card rounded-xl p-4', className)} role="status" aria-live="polite">
      <div className="mb-3 flex items-center justify-between">
        <span className={cn(typography.labelCaps, 'text-primary')}>{label}</span>
        <motion.span
          aria-hidden
          className="size-1.5 rounded-full bg-secondary"
          animate={animate ? { opacity: [0.4, 1, 0.4] } : undefined}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="font-mono text-body-code">
        <AnimatePresence mode="popLayout">
          {lines.slice(0, visible).map((line, i) => (
            <motion.div
              key={`${line}-${i}`}
              variants={codeLineReveal}
              initial={animate ? 'hidden' : false}
              animate="show"
              className={cn(
                'whitespace-pre-wrap leading-relaxed',
                line.trim().startsWith('//') ? 'text-outline' : 'text-on-surface',
              )}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="inline-flex items-center gap-1 text-primary">
          <span className="font-mono">▍</span>
          <motion.span
            className="inline-block h-3.5 w-1.5 bg-primary align-middle"
            animate={animate ? { opacity: [1, 0, 1] } : undefined}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
        </span>
      </div>
    </div>
  );
}

const DEFAULT_LINES = [
  '// routing model: claude-sonnet',
  'function syncMemory(chunks) {',
  '  return chunks.map(indexVector);',
  '}',
];
