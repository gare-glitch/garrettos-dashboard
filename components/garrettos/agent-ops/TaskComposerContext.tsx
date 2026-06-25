'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * TaskComposerContext owns the open state of the TaskComposer drawer so any
 * part of the UI (command palette, voice provider, dock FAB, /openclaw page)
 * can open it without prop-drilling.
 */
type TaskComposerContextValue = {
  open: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  toggleComposer: () => void;
};

const TaskComposerContext = createContext<TaskComposerContextValue | null>(null);

export function TaskComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openComposer = useCallback(() => setOpen(true), []);
  const closeComposer = useCallback(() => setOpen(false), []);
  const toggleComposer = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo<TaskComposerContextValue>(
    () => ({ open, openComposer, closeComposer, toggleComposer }),
    [open, openComposer, closeComposer, toggleComposer],
  );
  return <TaskComposerContext.Provider value={value}>{children}</TaskComposerContext.Provider>;
}

export function useTaskComposer(): TaskComposerContextValue {
  const ctx = useContext(TaskComposerContext);
  if (!ctx) {
    return {
      open: false,
      openComposer: () => {},
      closeComposer: () => {},
      toggleComposer: () => {},
    };
  }
  return ctx;
}
