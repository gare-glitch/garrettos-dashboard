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
 * Defensively extract `data` from a route response, tolerating the old
 * double-nested envelope shape `{ data: { data, source, fetchedAt }, ... }`
 * that an earlier version of the server provider could emit. If the outer
 * `data` is itself a ProviderResult (has its own `data`/`source`/`fetchedAt`),
 * unwrap one level and prefer the inner `source`/`warning`.
 */
function normalizeEnvelope<T>(json: unknown): FetchJson<T> {
  if (!json || typeof json !== 'object') {
    throw new Error('malformed response');
  }
  const outer = json as Partial<FetchJson<T>> & { data?: unknown };
  const inner = outer.data as Partial<FetchJson<T>> | undefined;
  if (
    inner &&
    typeof inner === 'object' &&
    'data' in inner &&
    'source' in inner &&
    'fetchedAt' in inner
  ) {
    // Double-nested: unwrap one level.
    return {
      data: inner.data as T,
      source: (inner.source ?? outer.source ?? 'mock') as DataSource,
      warning: inner.warning ?? outer.warning,
      fetchedAt: (inner.fetchedAt ?? outer.fetchedAt ?? '') as string,
    };
  }
  return outer as FetchJson<T>;
}

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
        const raw = await res.json();
        const json = normalizeEnvelope<T>(raw);
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
