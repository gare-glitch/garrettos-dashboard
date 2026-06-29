'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type CommandPaletteContextValue = {
  open: boolean;
  /** Query prefilled into the palette when it opens (e.g. a voice transcript). */
  initialQuery: string;
  openPalette: () => void;
  /** Open the palette with a prefilled query (M13 voice fallback). */
  openPaletteWithQuery: (query: string) => void;
  closePalette: () => void;
  togglePalette: () => void;
  /** Clear the prefilled query (called after the palette consumes it). */
  consumeInitialQuery: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  const openPalette = useCallback(() => {
    setInitialQuery('');
    setOpen(true);
  }, []);
  const openPaletteWithQuery = useCallback((query: string) => {
    setInitialQuery(query);
    setOpen(true);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);
  const togglePalette = useCallback(() => setOpen((v) => !v), []);
  const consumeInitialQuery = useCallback(() => setInitialQuery(''), []);

  return (
    <CommandPaletteContext.Provider
      value={{
        open,
        initialQuery,
        openPalette,
        openPaletteWithQuery,
        closePalette,
        togglePalette,
        consumeInitialQuery,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPaletteContext() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('useCommandPaletteContext must be used within CommandPaletteProvider');
  }
  return ctx;
}

/** Standalone hook when provider is unavailable */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const openPalette = useCallback(() => {
    setInitialQuery('');
    setOpen(true);
  }, []);
  const openPaletteWithQuery = useCallback((query: string) => {
    setInitialQuery(query);
    setOpen(true);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);
  const togglePalette = useCallback(() => setOpen((v) => !v), []);
  const consumeInitialQuery = useCallback(() => setInitialQuery(''), []);
  return { open, initialQuery, openPalette, openPaletteWithQuery, closePalette, togglePalette, consumeInitialQuery };
}
