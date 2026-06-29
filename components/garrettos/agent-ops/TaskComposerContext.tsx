'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type TaskComposerPrefill = {
  title?: string;
  description?: string;
  agent?: 'opencode' | 'claude' | 'openclaw' | 'manual';
  requiresApproval?: boolean;
  composioTools?: string[];
  source?: 'voice' | 'manual';
};

type TaskComposerContextValue = {
  open: boolean;
  /** Prefill applied the next time the composer opens (M13 voice "Edit in composer"). */
  prefill: TaskComposerPrefill | null;
  openComposer: () => void;
  /** Open the composer with a prefilled draft (M13). */
  openComposerWithPrefill: (prefill: TaskComposerPrefill) => void;
  closeComposer: () => void;
  toggleComposer: () => void;
  /** Clear the prefill after the composer consumes it. */
  consumePrefill: () => void;
};

const TaskComposerContext = createContext<TaskComposerContextValue | null>(null);

export function TaskComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<TaskComposerPrefill | null>(null);

  const openComposer = useCallback(() => {
    setPrefill(null);
    setOpen(true);
  }, []);
  const openComposerWithPrefill = useCallback((p: TaskComposerPrefill) => {
    setPrefill(p);
    setOpen(true);
  }, []);
  const closeComposer = useCallback(() => setOpen(false), []);
  const toggleComposer = useCallback(() => setOpen((v) => !v), []);
  const consumePrefill = useCallback(() => setPrefill(null), []);

  const value = useMemo<TaskComposerContextValue>(
    () => ({ open, prefill, openComposer, openComposerWithPrefill, closeComposer, toggleComposer, consumePrefill }),
    [open, prefill, openComposer, openComposerWithPrefill, closeComposer, toggleComposer, consumePrefill],
  );
  return <TaskComposerContext.Provider value={value}>{children}</TaskComposerContext.Provider>;
}

export function useTaskComposer(): TaskComposerContextValue {
  const ctx = useContext(TaskComposerContext);
  if (!ctx) {
    return {
      open: false,
      prefill: null,
      openComposer: () => {},
      openComposerWithPrefill: () => {},
      closeComposer: () => {},
      toggleComposer: () => {},
      consumePrefill: () => {},
    };
  }
  return ctx;
}
