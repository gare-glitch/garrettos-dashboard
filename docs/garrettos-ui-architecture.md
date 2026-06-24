# GarrettOS UI Architecture

## Purpose

GarrettOS is a personal AI operating system — not a dashboard page collection. The UI layer orchestrates agents, infrastructure, memory, health, research, and revenue through a unified command surface.

## Layer model

```
app/(dashboard)/*     Route pages (composition only)
components/garrettos/ OS primitives (Shell, CommandDock, MetricCard, …)
components/ui/        shadcn-style atoms (Button, Input, Card)
lib/                  utils, design tokens, Supabase
data/mock.ts          Phase 1 mock orchestration data
```

## Design principles

1. **Information density** — show signal first; decoration is secondary.
2. **Composability** — pages assemble primitives; primitives never embed route logic.
3. **Extensibility** — mock data shapes match future API contracts.
4. **Accessibility** — semantic HTML, ARIA labels, reduced-motion support.
5. **Production quality** — typed props, responsive layouts, build-gated deploys.

## Visual language

- Deep navy/black canvas (`#050816`)
- Subtle glass panels with thin borders (`rgba(148,163,184,0.18)`)
- Soft cyan/violet accent glow (minimal gradient use)
- Inter typography, tight tracking on headings
- Intentional Framer Motion (springs, layout transitions)

## Future integrations (UI contracts only)

| Domain | Component | Future source |
|--------|-----------|---------------|
| Agents | AgentGraph, TaskQueue | OpenClaw, Composio |
| Models | Model routing panel | LiteLLM, Ollama |
| Memory | MemoryTimeline | Obsidian, Qdrant |
| Health | MetricCard, Sparkline | Garmin |
| Infra | SystemTopology | VPS metrics API |
| Voice | (future) | ElevenLabs |
| Forecast | (future) | TimesFM |

## Route preservation

All existing routes remain. Auth middleware and API endpoints are untouched. Visual redesign is presentation-layer only.
