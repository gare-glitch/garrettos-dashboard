'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMotionPreferences } from '../motion';
import './Strands.css';

/**
 * Strands — a typed, browser-safe TypeScript port of the React Bits "Strands"
 * ambient WebGL visual. Uses OGL only in the browser, cleans up its WebGL
 * context on unmount, and renders a static gradient fallback under
 * prefers-reduced-motion or minimal motion mode.
 *
 * Ambient by design: low opacity, slow speed, GarrettOS sand/sage/tertiary
 * palette. Never flashy. Pointer-events disabled so it never blocks UI.
 */

export type StrandsProps = {
  /** Hex colors for the strands. Default: GarrettOS sand/sage/tertiary. */
  colors?: string[];
  count?: number;
  speed?: number;
  amplitude?: number;
  waviness?: number;
  thickness?: number;
  glow?: number;
  taper?: number;
  spread?: number;
  intensity?: number;
  saturation?: number;
  opacity?: number;
  scale?: number;
  glass?: boolean;
  className?: string;
};

export const STRANDS_DEFAULTS: {
  colors: string[];
  count: number;
  speed: number;
  amplitude: number;
  waviness: number;
  thickness: number;
  glow: number;
  taper: number;
  spread: number;
  intensity: number;
  saturation: number;
  opacity: number;
  scale: number;
  glass: boolean;
} = {
  colors: ['#ecbda4', '#b9cda4', '#b8c8da'],
  count: 3,
  speed: 0.28,
  amplitude: 0.65,
  waviness: 0.85,
  thickness: 0.42,
  glow: 1.8,
  taper: 3,
  spread: 1,
  intensity: 0.42,
  saturation: 1.05,
  opacity: 0.45,
  scale: 1.35,
  glass: false,
};

export function Strands(props: StrandsProps) {
  const p = { ...STRANDS_DEFAULTS, ...props };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = !reduceMotion && mode !== 'minimal';

  // Stable dependency key so the scene rebuilds only when config or motion changes.
  const configKey = [
    p.colors.join(','),
    p.count, p.speed, p.amplitude, p.waviness, p.thickness, p.glow,
    p.taper, p.spread, p.intensity, p.saturation, p.opacity, p.scale, p.glass,
  ].join('|');

  useEffect(() => {
    if (!animate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // Dynamic import keeps OGL out of the SSR bundle and ensures it only runs
    // in the browser where WebGL exists.
    import('ogl')
      .then((OGL) => {
        if (disposed || !canvas) return;
        try {
          cleanup = buildStrandsScene(canvas, p, OGL);
        } catch {
          // WebGL unavailable at runtime — the CSS fallback gradient covers this.
        }
      })
      .catch(() => {
        /* ogl failed to load — fallback gradient remains */
      });

    return () => {
      disposed = true;
      cleanup?.();
      cleanup = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, configKey]);

  if (!animate) {
    return (
      <div className={`garrettos-strands${props.className ? ` ${props.className}` : ''}`} aria-hidden>
        <div className="garrettos-strands__fallback" />
      </div>
    );
  }

  return (
    <div className={`garrettos-strands${props.className ? ` ${props.className}` : ''}`} aria-hidden>
      <canvas ref={canvasRef} className="garrettos-strands__canvas" />
    </div>
  );
}

// --- OGL scene (browser-only) ----------------------------------------------

type StrandsConfig = typeof STRANDS_DEFAULTS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OGLModule = any;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildStrandsScene(
  canvas: HTMLCanvasElement,
  cfg: StrandsConfig,
  OGL: OGLModule,
): () => void {
  const { Renderer, Program, Mesh, Vec2, Triangle } = OGL;
  if (!Renderer || !Program || !Mesh || !Vec2 || !Triangle) {
    throw new Error('ogl missing required classes');
  }

  const renderer = new Renderer({
    dpr: Math.min(window.devicePixelRatio || 1, 1.75),
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  const gl = renderer.gl as WebGLRenderingContext | WebGL2RenderingContext;
  gl.clearColor(0, 0, 0, 0);
  // OGL's Renderer only ever produces a real HTMLCanvasElement; cast through
  // unknown to satisfy the union type from the OGL typings.
  const glCanvas = gl.canvas as unknown as HTMLCanvasElement;
  canvas.appendChild(glCanvas);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const uColors: number[] = [];
  for (const hex of cfg.colors.slice(0, 3)) {
    const [r, g, b] = hexToRgb(hex);
    uColors.push(r, g, b);
  }
  while (uColors.length < 9) uColors.push(0, 0, 0);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vec2(canvas.clientWidth, canvas.clientHeight) },
    uColors: { value: uColors },
    uCount: { value: cfg.count },
    uSpeed: { value: cfg.speed },
    uAmplitude: { value: cfg.amplitude },
    uWaviness: { value: cfg.waviness },
    uThickness: { value: cfg.thickness },
    uGlow: { value: cfg.glow },
    uTaper: { value: cfg.taper },
    uSpread: { value: cfg.spread },
    uIntensity: { value: cfg.intensity },
    uSaturation: { value: cfg.saturation },
    uOpacity: { value: cfg.opacity },
    uScale: { value: cfg.scale },
    uGlass: { value: cfg.glass ? 1 : 0 },
  };

  const program = new Program(gl, {
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
  });

  const geometry = new Triangle(gl);
  const mesh = new Mesh(gl, { geometry, program });

  let raf = 0;
  let running = true;
  const start = performance.now();

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    uniforms.uResolution.value.set(canvas.clientWidth, canvas.clientHeight);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const tick = () => {
    if (!running) return;
    uniforms.uTime.value = (performance.now() - start) / 1000;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    try { geometry?.remove(); } catch { /* ignore */ }
    try { program?.remove(); } catch { /* ignore */ }
    try { renderer?.destroy(); } catch { /* ignore */ }
    try { (gl.canvas as unknown as HTMLCanvasElement)?.remove(); } catch { /* ignore */ }
    // Lose the WebGL context explicitly to free GPU memory.
    try {
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext?.();
    } catch { /* ignore */ }
  };
}

const VERT = /* glsl */ `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uColors[9];
uniform float uCount;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uIntensity;
uniform float uSaturation;
uniform float uOpacity;
uniform float uScale;
uniform float uGlass;

vec3 hue(float h) {
  return 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + h));
}

float strand(vec2 uv, float t, float seed) {
  float x = uv.x * uScale;
  float y = uv.y * uScale;
  float wave = sin(x * 3.0 + t * uSpeed + seed * 6.2831) * uWaviness;
  wave += sin(x * 7.0 - t * uSpeed * 1.3 + seed * 3.14) * uWaviness * 0.5;
  float dy = abs(y - wave - seed);
  float strandShape = smoothstep(uThickness, 0.0, dy);
  float taperMask = smoothstep(0.0, uTaper * 0.15, uv.x) * smoothstep(1.0, 1.0 - uTaper * 0.15, uv.x);
  return strandShape * taperMask;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv.x *= aspect;

  float t = uTime;
  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 3.0; i += 1.0) {
    if (i >= uCount) break;
    float seed = (i + 0.5) / uCount;
    float s = strand(uv + vec2(seed * uSpread, 0.0), t, seed);
    int ci = int(i) * 3;
    vec3 base = vec3(uColors[ci], uColors[ci + 1], uColors[ci + 2]);
    float l = dot(base, vec3(0.299, 0.587, 0.114));
    base = mix(vec3(l), base, uSaturation);
    col += base * s * uIntensity * (1.0 + uGlow * s);
  }

  float alpha = clamp(col.r + col.g + col.b, 0.0, 1.0) * uOpacity;
  if (uGlass > 0.5) {
    col += hue(uTime * 0.03) * 0.02;
  }
  gl_FragColor = vec4(col, alpha);
}
`;
