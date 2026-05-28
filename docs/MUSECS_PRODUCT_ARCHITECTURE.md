# MUSECS Product Architecture

MUSECS is a mobile-first PWA music platform for Russia and CIS: music discovery, social presence, shared listening, and music games. It should feel like a premium realtime social product, not a Spotify clone.

## Non-Negotiable Product Stance

MUSECS must support multiple music sources, but it must not be designed as a piracy or leak distribution system. Providers are technical adapters, not a license bypass. The product should support official APIs, user-owned/self-hosted libraries, creator uploads, legal public sources, and community providers that pass policy and safety gates.

This matters for architecture too: every source needs provenance, trust level, terms metadata, rate limits, and a kill switch.

## Design Direction

Use a cinematic mobile dark interface:

- Base: deep near-black, not flat pure black everywhere.
- Surfaces: layered translucent panels with restrained blur.
- Accent system: album-art-derived gradients plus a stable green/cyan playback accent.
- Motion: spring-based, interruptible, transform/opacity only.
- Layout: mobile-first, bottom navigation, thumb-reachable controls, safe-area aware.
- Personality: premium, social, slightly underground, alive.

Avoid:

- Generic SaaS dashboard patterns.
- Purple-blue gradient soup.
- Copying Spotify's information architecture one-to-one.
- Decoration-only glass blobs that do not communicate playback, presence, or depth.

## Core Stack

Frontend:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand for local client state
- TanStack Query for async server/cache state
- PWA service worker
- Media Session API
- Web Audio API for visualization, crossfade, normalization, and game clips

Backend:

- Supabase Auth
- Supabase Postgres
- Supabase Realtime Broadcast and Presence
- Supabase Edge Functions for provider gateway, media proxy, webhooks, and AI orchestration
- Supabase Storage for avatars, generated covers, and user-owned uploads only

Supabase Realtime should prefer Broadcast for low-latency client events and Presence for online/current-listening state. Postgres Changes should be used sparingly for lower-volume database events.

## Feature-Based Frontend Architecture

```txt
src/
  app/
    (auth)/
    (main)/
    api/
  features/
    auth/
    profiles/
    home/
    search/
    player/
    queue/
    providers/
    playlists/
    social/
    presence/
    listen-together/
    game/
    notifications/
    pwa/
  shared/
    ui/
    motion/
    audio/
    realtime/
    supabase/
    lib/
    types/
```

Rules:

- UI components are dumb and typed.
- Feature services own data fetching and mutations.
- Audio engine is centralized, never scattered across screens.
- Realtime events are typed and versioned.
- Provider calls never happen directly from UI components.

## Data Flow

```txt
User intent
  -> feature action / Zustand command
  -> domain service
  -> Supabase / provider gateway / realtime channel
  -> normalized domain model
  -> TanStack Query cache + Zustand playback state
  -> UI + Media Session + service worker cache
```

Use optimistic updates for likes, follows, reposts, queue edits, and session reactions. Do not optimistic-update playback authority in synced sessions unless the user is host.

## Provider System

Inspired by MusicFree's separation between player and plugins:

- the app itself is a player/social platform;
- providers implement search, metadata, stream resolution, lyrics, imports, and charts;
- providers are ranked, enabled/disabled, and can be redirected/fallbacked;
- normalized metadata is stored separately from source-specific payloads.

### Provider Contract

```ts
export type ProviderCapability =
  | "search"
  | "resolveStream"
  | "lyrics"
  | "album"
  | "artist"
  | "playlistImport"
  | "charts";

export interface MusicProvider {
  id: string;
  name: string;
  version: string;
  trustLevel: "official" | "community-reviewed" | "self-hosted" | "local";
  capabilities: ProviderCapability[];
  regions?: string[];
  search(input: SearchInput): Promise<SearchPage>;
  resolveStream?(input: StreamResolveInput): Promise<StreamCandidate[]>;
  getLyrics?(input: LyricsInput): Promise<LyricsResult | null>;
}
```

### Search Federation

Search should query providers concurrently with budgets:

- fast lane: trusted/low-latency providers, 700-1200 ms budget;
- deep lane: slower providers, 2500-5000 ms budget;
- local cache: instant stale results while network updates;
- result merge: fingerprint by title, artist, duration, ISRC when available, acoustic hash later;
- ranking: exactness, source health, user preference, friends activity, availability, quality.

### Stream Failover

Playback resolves stream candidates in order:

1. cached playable URL if still valid;
2. selected provider stream;
3. same track from fallback provider;
4. similar track match from search federation;
5. user-visible graceful error with retry/source picker.

Every stream candidate should include:

- provider id
- quality
- content type
- required headers
- expiry time
- proxy requirement
- legal/provenance flags
- estimated latency and historical failure rate

## Regional Resilience

Russia/CIS access can be unstable, so routing is a first-class concern:

- Provider Gateway: server-side abstraction that can call providers, normalize data, and hide provider secrets.
- Edge Relay: lightweight pass-through for metadata and short-lived stream redirects.
- Media Proxy: opt-in and budgeted; avoid proxying all audio through our servers by default.
- Mirror Registry: provider endpoint health, regional availability, and fallback order.
- Circuit Breakers: stop hammering broken providers.
- Adaptive Retry: exponential backoff with jitter, capped per provider/user.
- Cache Strategy: metadata aggressively, streams carefully, covers with stale-while-revalidate.

Bandwidth rule: proxy metadata and signed stream negotiation where useful; do not become the default audio CDN unless tracks are user-owned, licensed, or explicitly cacheable.

## Audio Engine

Central module: `shared/audio/audio-engine.ts`.

Responsibilities:

- HTMLAudioElement lifecycle
- Web Audio graph
- queue and preloading
- crossfade
- gain/normalization
- playback speed and pitch controls
- progress ticks
- Media Session metadata/actions
- lockscreen controls
- AirPlay where browser-supported
- haptic-like visual feedback hooks
- synced-session command application

State split:

- `PlaybackState`: current track, source, duration, position, paused, buffering, quality.
- `QueueState`: items, cursor, history, upcoming.
- `AudioSettings`: crossfade, normalization, speed, pitch, sleep timer.
- `SyncState`: session id, role, host clock, drift, authority.

## Synced Listening

Use a host-authoritative model.

Channel types:

- Presence: members, online state, current listening summary.
- Broadcast: playback commands, reactions, heartbeat, chat typing.
- Database: durable session/member records, invite lifecycle, final chat messages.

Playback event:

```ts
interface PlaybackCommand {
  id: string;
  sessionId: string;
  hostId: string;
  type: "play" | "pause" | "seek" | "track" | "queue";
  trackId?: string;
  positionMs: number;
  hostSentAt: number;
  hostMonotonicMs: number;
  sequence: number;
}
```

Sync algorithm:

1. Client receives command.
2. Estimate latency from heartbeat round trips.
3. Compute target position: `positionMs + estimatedOneWayLatency`.
4. If drift is under 120 ms, adjust playbackRate briefly.
5. If drift is 120-700 ms, seek quietly.
6. If drift is above 700 ms or source differs, reconcile track/source.
7. On reconnect, fetch durable session state, then apply latest command.

Host migration:

- if host disconnects for more than 8-12 seconds, elect next member by joined_at + connection health;
- new host emits `host_migrated`;
- all clients reconcile from durable state.

## Music Guessing Game

Game rooms reuse the realtime core but have stricter authority:

- server/host chooses round seed;
- clients get a signed clip window, not the answer;
- answers submitted to Edge Function;
- scoring uses server time plus client latency compensation;
- leaderboard is durable in Postgres.

Modes:

- 1 second
- 3 second
- endless
- friends battle
- daily challenge
- underground challenge

## Database Model

Core tables:

- `profiles`
- `follows`
- `tracks`
- `track_sources`
- `playlists`
- `playlist_tracks`
- `likes`
- `reposts`
- `listening_history`
- `presence_snapshots`
- `live_sessions`
- `live_session_members`
- `live_playback_state`
- `session_messages`
- `game_rooms`
- `game_rounds`
- `game_scores`
- `notifications`
- `provider_registry`
- `provider_health`
- `provider_user_settings`
- `playback_failures`

Security:

- RLS enabled on all exposed tables.
- Never authorize from user-editable metadata.
- Service role only in Edge Functions/server environment.
- Provider secrets stored server-side only.
- Rate limits on search, stream resolve, invites, comments, and game answers.

## PWA Strategy

Mobile Safari compatibility is critical:

- install education screen for iOS Safari;
- standalone display mode;
- safe-area CSS variables;
- offline shell;
- cached navigation, profile shell, last queue, recently played metadata;
- background playback best-effort through audio element and Media Session API;
- push notifications for invites and friend activity where supported;
- graceful fallback when push/background behavior is limited by iOS.

Service worker caching:

- app shell: cache-first with versioning;
- images/covers: stale-while-revalidate;
- metadata API: network-first with short fallback;
- audio: no blind cache by default; only explicit licensed/user-owned/cacheable files.

## MVP Scope

Build first:

1. Next.js app shell and MUSECS design system.
2. Supabase Auth: Google, Apple, Telegram, magic links.
3. Profiles, usernames, follows.
4. Provider gateway with mock provider + legal/self-hosted provider contract.
5. Federated search UI with source chips and loading states.
6. Audio engine with queue, mini-player, fullscreen player, Media Session.
7. Playlists and likes.
8. Realtime presence.
9. Two-person synced listening.
10. PWA install/offline shell.

Do not put game, AI, marketplace, and full group sessions into MVP code until the player/provider/realtime base is solid.

## References

- MusicFree repository and plugin concept: https://github.com/maotoumao/MusicFree
- MusicFree plugin examples: https://github.com/maotoumao/MusicFreePlugins
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Broadcast: https://supabase.com/docs/guides/realtime/broadcast
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
