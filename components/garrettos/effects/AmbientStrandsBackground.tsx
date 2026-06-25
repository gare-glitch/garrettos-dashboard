'use client';

import { cn } from '@/lib/utils';
import { Strands, type StrandsProps } from './Strands';

/**
 * AmbientStrandsBackground — the GarrettOS-preset Strands layer used behind
 * the login card and the home hero. Pointer-events-none, low opacity, calm.
 *
 * Defaults to the sand/sage/tertiary GarrettOS palette. Override per-usage if
 * needed, but keep it ambient — never flashy.
 */
export function AmbientStrandsBackground({
  className,
  ...overrides
}: Partial<StrandsProps> & { className?: string }) {
  return (
    <Strands
      colors={['#ecbda4', '#b9cda4', '#b8c8da']}
      count={3}
      speed={0.28}
      amplitude={0.65}
      waviness={0.85}
      thickness={0.42}
      glow={1.8}
      taper={3}
      spread={1}
      intensity={0.42}
      saturation={1.05}
      opacity={0.45}
      scale={1.35}
      glass={false}
      className={cn('absolute inset-0 z-0', className)}
      {...overrides}
    />
  );
}
