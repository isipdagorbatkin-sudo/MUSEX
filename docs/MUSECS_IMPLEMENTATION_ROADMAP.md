# MUSECS Implementation Roadmap

## Phase 0: Foundation

- Initialize Next.js, TypeScript, Tailwind, Framer Motion.
- Add PWA shell and manifest.
- Create design tokens and base layout primitives.
- Add Supabase client setup.
- Add linting, formatting, and path aliases.

Exit criteria:

- mobile app shell opens locally;
- installable PWA metadata exists;
- home/player/search routes render responsive skeletons.

## Phase 1: Auth And Profiles

- Supabase Auth providers: Google, Apple, Telegram, magic link.
- Username reservation flow.
- Profile table and RLS.
- Avatar upload.
- Follow/unfollow.

Exit criteria:

- user can sign in, claim username, view own profile, follow another seeded user.

## Phase 2: Provider Gateway And Search

- Provider TypeScript contract.
- Mock provider.
- Self-hosted provider placeholder.
- Edge Function route: `search`.
- Result normalization and source provenance.
- Search UI with source state chips.

Exit criteria:

- user searches once and sees normalized results with provider status and fallback UI.

## Phase 3: Audio Engine

- Central audio engine.
- Queue store.
- Mini-player.
- Fullscreen immersive player.
- Media Session metadata/actions.
- Smart preload for next track.
- Playback failure reporting.

Exit criteria:

- search result can be played, paused, seeked, queued, and restored after refresh.

## Phase 4: Library And Social Base

- Likes.
- Playlists.
- Listening history.
- Friend activity.
- Realtime presence.

Exit criteria:

- friend activity updates without refresh;
- current listening presence appears in home/social/profile.

## Phase 5: Two-Person Listen Together

- Live session tables.
- Invite flow.
- Supabase Realtime Broadcast channel.
- Heartbeat sync.
- Drift correction.
- Reconnect reconciliation.

Exit criteria:

- two browser sessions can join, host plays/seeks/pauses, listener stays within target drift.

## Phase 6: PWA Hardening

- Offline shell.
- Cached metadata.
- iOS install education.
- Standalone mode polish.
- Push notification plan.

Exit criteria:

- app is usable from mobile home screen with last-known shell and graceful offline state.

## V2

- Music guessing game.
- Group listening.
- Session chat.
- Reactions.
- AI recommendations.
- Weekly recap.

## V3

- Provider marketplace.
- Creator profiles.
- Advanced recommendation engine.
- Desktop shell.
- Native wrappers.
