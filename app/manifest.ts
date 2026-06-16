import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GarrettOS',
    short_name: 'GarrettOS',
    description: 'Private OpenClaw-powered life dashboard for health, gym, water, AI agents, memory, and systems.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050816',
    theme_color: '#38bdf8',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
