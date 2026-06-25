/**
 * Provider resolver for route handlers (M7).
 *
 * Picks the mock or server provider based on `GARRETTOS_DATA_MODE` and returns
 * the singleton to use for a request.
 */

import { resolveDataMode } from './providers';
import { mockProvider } from './mock-provider';
import { serverProvider } from './server-provider';
import type { GarrettOSDataProvider } from './providers';

export function getProvider(env: NodeJS.ProcessEnv = process.env): GarrettOSDataProvider {
  return resolveDataMode(env) === 'server' ? serverProvider : mockProvider;
}
