# GarrettOS Voice Command Layer (M13)

A Siri/Raycast-style voice interface for GarrettOS. Press a hotkey, speak naturally, see the transcript, and GarrettOS converts speech into **safe, proposed** commands or queued tasks. Voice never mutates state directly — every mutating action becomes an approval-gated task.

## Hotkeys

| Platform | Hotkey |
| --- | --- |
| macOS | `⌘ + Shift + Space` |
| Windows / Linux | `Ctrl + Shift + Space` |

Pressing the hotkey opens the `VoiceCommandOverlay` and begins listening (if the browser supports speech). `Esc` closes the overlay. A mic button is also available in the TopAppBar, the Command Palette, and the Home hero.

## Browser support

The layer uses the native **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) — no paid API required for v1.

- **Supported**: Chrome, Edge, and Safari (vendor-prefixed) provide `SpeechRecognition`.
- **Unsupported**: Firefox and some browsers do not expose the API. The overlay detects this and shows a **typed fallback** input — you can still type a command (e.g. `draft an email to…`) and it is parsed by the same intent engine.
- **Reduced motion**: the orb and ring animations are suppressed; recognition still works and the typed fallback is always available.
- **Microphone permission**: if the user denies mic access, the overlay shows a clear "Microphone blocked" note and falls back to typing.

## Architecture

```
lib/garrettos/voice/
  voice-types.ts          # VoicePhase, VoiceIntent, VoiceAction, VoiceTaskResult
  intent-parser.ts        # deterministic, local intent parser (no network)
  action-router.ts        # intent → typed action (navigate / queue / review / fallback)
  useVoiceRecognition.ts  # Web Speech API engine: interim/final, phase machine, intent parse

components/garrettos/voice/
  VoiceOrb.tsx            # phase-aware concentric orb (calm, no glitch)
  VoiceTranscript.tsx     # live interim (muted) + final (bright) transcript
  VoiceIntentCard.tsx     # parsed intent: kind, agent, Composio tools, approval badge
  VoiceActionPreview.tsx  # what will happen + approval buttons
  VoiceCommandOverlay.tsx # the full overlay (composes the above + typed fallback)
  VoiceHotkeyListener.tsx # global Cmd/Ctrl+Shift+Space listener
  VoiceSettingsPanel.tsx  # Settings card: support, hotkey, Composio, safety, future TTS
```

The M9A `components/garrettos/speech/` primitives (`useBrowserSpeech`, `SpeechOrb`, `VoiceStatusChip`, `VoiceCommandButton`) remain the shared foundation. The `VoiceProvider` (in `speech/`) now wraps `useVoiceRecognition` and is the **single place** a voice intent becomes a side-effect.

## State machine

`VoicePhase`: `idle → listening → transcribing → interpreting → needs_approval → queued` (with `error` / `unsupported` branches).

- `listening` / `transcribing`: orb breathes, interim transcript streams.
- `interpreting`: final transcript parsed into an intent.
- `needs_approval`: a task/composio action is proposed; the user must approve.
- `queued`: the task was written successfully.
- `error` / `unsupported`: surfaced with a typed fallback.

## Supported voice commands

Intent matching is forgiving (lowercased substring) because browser recognition is noisy. Ordered most-specific → least-specific.

### Navigation (routes immediately, no approval)
- "open memory" / "show memory" / "neural index"
- "go to system" / "open system" / "system health" / "open health"
- "show OpenClaw" / "open OpenClaw" / "agent ops" / "launch agent"
- "show tasks" / "task queue" / "task board"
- "open projects" / "show projects"
- "show settings" / "open settings"
- "ask Garrett" / "open mentor"

### Task creation (queued task; approval-gated unless clearly read-only)
- "create a task to …"
- "ask OpenCode to …" → agent `opencode`
- "have Claude …" → agent `claude`
- "start an agent to …" / "have OpenClaw …" → agent `openclaw`
- "research …" → read-only review task (no approval)
- "review …" → read-only review task (no approval)

Read-only verbs (`research`, `review`, `look up`, `summarize`, `analyze`, `find`, `search`, `explain`, `audit`, …) produce a **review task** that does not require approval. Anything else produces a **queued task requiring approval**.

### Composio-safe actions (become queued/review tasks — never executed from voice)
- "draft an email to …" → `composio.draft_email` · toolkit `gmail` · **approval required** (draft only — never sends)
- "look up my latest emails" / "check my inbox" → `composio.read_emails` · `gmail` · read-only review task
- "show my GitHub repos" / "list my repositories" → `composio.github_repos` · `github` · read-only review task
- "create a GitHub issue …" → `composio.github_issue` · `github` · **approval required**
- "search my Google Drive for …" → `composio.drive_search` · read-only review task (the `googledrive` toolkit is not in the task allow-list yet; the intent is carried in the task body so the agent can use the Composio CLI if connected)

### Unknown
- Anything unrecognized → opens the **Command Palette** with the transcript prefilled, so the user is never left at a dead-end.

## Safety rules

1. **Voice never executes.** It only proposes actions or creates task records.
2. **Mutating actions require approval.** Sending email, creating calendar events, GitHub issue/PR mutations, LinkedIn/Instagram posting, file deletion/modification, and shell/system operations all set `requires_approval: true` and become a queued task. The UI shows a clear "Needs approval" badge and gate.
3. **Navigation is read-only** and routes immediately.
4. **Read-only queries** (research, review, list, read emails) create a review task with no approval gate.
5. **Composio toolkits are allow-listed** to `{gmail, google_calendar, github, slack, notion}` — matching the bridge + task-create validation. Unknown toolkits are dropped, never silently passed to an agent.
6. **No secrets in transcripts.** Transcripts are capped (1000 chars) and shell-metacharacter-scrubbed by the API route and bridge before being written to task frontmatter.

## Task creation behavior

When you approve a task action, the overlay POSTs to `POST /api/garrettos/tasks/create` (the existing, already-validated endpoint) with:

```json
{
  "title": "Draft email — Professor Smith",
  "description": "Use Composio Gmail tools to DRAFT (not send) an email…",
  "agent": "opencode",
  "priority": "medium",
  "requiresApproval": true,
  "composioTools": ["gmail"],
  "source": "voice",
  "transcript": "Draft an email to Professor Smith asking to meet next week.",
  "intent": "composio.draft_email"
}
```

The written task markdown frontmatter includes the voice provenance:

```yaml
---
id: draft-email-professor-20260629-1512
title: Draft email — Professor Smith
status: queued
agent: opencode
priority: medium
requires_approval: true
source: voice
composio_tools: gmail
transcript: Draft an email to Professor Smith asking to meet next week.
intent: composio.draft_email
created_at: 2026-06-29T15:12:00+00:00
---
```

"Edit in composer" opens the existing `TaskComposer` drawer prefilled with the voice intent (title, description, agent, approval flag, Composio tools, `source: voice`) so you can refine before queuing.

The M11 loop daemon picks up the queued task like any other, injects M12 memory context, and launches a supervised tmux agent run. Composio actions run inside that tmux session via the Composio CLI, governed by the M12B agent policy (CLI mode, `requires_approval` for destructive actions, no token exposure).

## Composio voice workflow

```
speak "draft an email to Professor Smith"
  → intent parser: composio.draft_email (gmail, approval required)
  → action router: queue-task
  → overlay: shows intent card + "Queue task" (approval gate)
  → user clicks "Queue task"
  → POST /api/garrettos/tasks/create (source: voice, composio_tools: [gmail])
  → bridge writes queued task markdown
  → M11 loop daemon detects it → M12 memory injection → tmux agent run
  → agent uses Composio Gmail CLI to DRAFT (not send)
```

The dashboard **never** triggers a Composio action directly. It only displays Composio readiness (see `ComposioStatusCard`) and creates tasks that reference Composio toolkits.

## Future: ElevenLabs + Whisper

v1 uses the free, browser-native Web Speech API for speech recognition. Two future upgrades are surfaced in the Settings panel as "Future":

- **ElevenLabs (text-to-speech)** — spoken responses from GarrettOS. The phase machine already has a `speaking` state in the legacy `VoiceState`; wiring ElevenLabs would add a spoken reply after a task is queued or a navigation completes.
- **OpenAI Whisper (speech-to-text)** — higher-accuracy transcription. The integration point is `useVoiceRecognition`: swap the `SpeechRecognition` instance for a Whisper-backed recorder (capture audio → POST to a Whisper endpoint → receive transcript → feed into the same `interpret()` path). The intent parser, action router, and overlay would not change.

The `VoiceSettingsPanel` shows the current status of both as `Future` so it's clear they are not wired yet.

## Troubleshooting

- **"Voice unsupported" / no mic button response**: the browser doesn't expose `SpeechRecognition`. Use the typed fallback in the overlay, or switch to Chrome/Edge/Safari.
- **"Microphone blocked"**: allow microphone access for the site in your browser settings (Site permissions → Microphone), then reload and press the hotkey again.
- **Nothing happens when I speak**: check the OS mic input level and that no other app is holding the microphone. The overlay shows "Listening…" while active; if it returns to idle with no transcript, recognition likely got `no-speech` — try again in a quieter environment.
- **Wrong intent parsed**: v1 uses deterministic substring rules. Use the typed fallback or "Edit in composer" to correct the proposed task before queuing.
- **Task didn't appear on the board**: if the VPS bridge is unreachable, the task is recorded locally as mock. The overlay result banner shows the source (`mock` vs `server`).
