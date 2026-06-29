'use client';

import { useEffect } from 'react';
import { useVoice } from '../speech/VoiceProvider';

/**
 * VoiceHotkeyListener — global keyboard shortcut for the voice overlay.
 *   Mac:        Cmd + Shift + Space
 *   Windows:    Ctrl + Shift + Space
 *   Linux:      Ctrl + Shift + Space
 *
 * Opens the overlay and begins listening (if the browser supports speech).
 * Renders nothing — it only registers a window keydown listener.
 */
export function VoiceHotkeyListener() {
  const { openOverlay, start, overlayOpen } = useVoice();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        if (!overlayOpen) {
          openOverlay();
          // Defer start a tick so the overlay is mounted before recognition
          // begins — keeps the orb transition smooth.
          window.setTimeout(start, 60);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openOverlay, start, overlayOpen]);

  return null;
}
