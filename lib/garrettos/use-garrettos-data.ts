/**
 * Client data hook (M7).
 *
 * `useGarrettOSData` fetches a GarrettOS provider route and:
 *  - renders provider data on success,
 *  - falls back to importing the mock dataset directly on any fetch failure,
 *  - exposes `source` ('server' | 'mock' | 'stale') and `warning` so the UI can
 *    label live vs mock data.
 *
 * This is the single safe entry point for dashboard pages to consume the
 * provider/API layer. Pages never call `fetch('/api/garrettos/...')` ad hoc.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { DataSource } from './types';

export type GarrettOSDataState<T> = {
  data: T | null;
  source: DataSource;
  warning?: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type FetchJson<T> = { data: T; source: DataSource; warning?: string; fetchedAt: string };

/**
 * Fetch a GarrettOS provider route.
 *
 * @param route e.g. '/api/garrettos/health'
 * @param mockFallback a function returning the mock dataset (imported lazily so
 *   the page keeps working even if the API route is unavailable).
 */
export function useGarrettOSData<T>(
  route: string,
  mockFallback: () => T | Promise<T>,
): GarrettOSDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [source, setSource] = useState<DataSource>('mock');
  const [warning, setWarning] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(route, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FetchJson<T>;
        if (cancelled) return;
        setData(json.data);
        setSource(json.source);
        setWarning(json.warning);
        setError(null);
      } catch (e) {
        // Graceful fallback: use the mock dataset directly.
        try {
          const fallback = await mockFallback();
          if (cancelled) return;
          setData(fallback);
          setSource('mock');
          setWarning('Live data unavailable — showing mock data');
          setError(e instanceof Error ? e.message : 'fetch failed');
        } catch {
          if (!cancelled) setError('failed to load data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route, nonce]);

  return { data, source, warning, loading, error, refetch };
}
