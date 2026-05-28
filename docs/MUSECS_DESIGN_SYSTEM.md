# MUSECS Design System

## Brand Core

Name: MUSECS

Positioning: a realtime music social network for people who discover, share, and listen together.

Tone:

- confident
- nocturnal
- social
- precise
- slightly underground

One-sentence promise:

Music feels better when your friends are inside the moment with you.

## Visual Direction

Primary style: cinematic dark mobile.

Supporting styles:

- OLED entertainment UI
- motion-driven social app
- restrained liquid glass
- album-art-reactive gradients
- waveform/data accents

The interface should feel premium and alive, but not noisy. The music and friends are the spectacle.

## Token Draft

```css
:root {
  --bg-deep: #020203;
  --bg-base: #050506;
  --bg-raised: #0a0a0c;
  --surface-1: rgba(255, 255, 255, 0.05);
  --surface-2: rgba(255, 255, 255, 0.08);
  --border-soft: rgba(255, 255, 255, 0.08);
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --accent-play: #22c55e;
  --accent-social: #5eead4;
  --accent-depth: #5e6ad2;
  --danger: #ef4444;
  --warning: #f59e0b;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --ease-out-premium: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Album art can generate temporary local accents, but permanent UI states must map back to semantic tokens.

## Typography

Recommended direction:

- Display: `Space Grotesk` or `Geist`
- Body: `Inter` or `Geist Sans`
- Data/timers: `Geist Mono`

Rules:

- body starts at 16px on mobile;
- timers use tabular numbers;
- titles can be expressive but must not clip on narrow phones;
- no negative letter spacing.

## Mobile Navigation

Bottom nav max five items:

1. Home
2. Search
3. Player / Now
4. Social
5. Profile

Primary playback controls should remain thumb-reachable. Fullscreen player uses vertical hierarchy, not dense desktop controls.

## Key Screens

### Home

Purpose: answer "what should I hear now and what are my people hearing?"

Modules:

- now playing hero
- friends live strip
- trending among friends
- underground discoveries
- unreleased/self-hosted/community section with provenance labels
- recently played
- AI recommendations placeholder for later

### Search

Purpose: powerful source-aware discovery.

Modules:

- instant input
- source chips
- live provider states
- merged top results
- provider-specific tabs
- result provenance and quality hints
- retry/fallback affordances

### Player

Purpose: make playback feel like the center of the product.

Modules:

- animated album art
- background gradient from album art
- waveform/progress
- queue drawer
- lyrics sheet
- friend presence
- listen together CTA
- source/quality selector hidden behind advanced sheet

### Social

Purpose: realtime music identity.

Modules:

- friend activity
- current listening presence
- track posts
- timestamp shares
- reactions
- compatibility cards

### Listen Together

Purpose: make sync understandable.

States:

- invite sent
- waiting
- joining
- syncing
- in sync
- recovering connection
- host changed
- source unavailable

## Motion System

Use Framer Motion heavily but deliberately.

Rules:

- taps respond under 100 ms;
- regular UI transitions 150-300 ms;
- screen transitions up to 400 ms;
- transform and opacity only for hot paths;
- respect `prefers-reduced-motion`;
- gestures must be interruptible.

Signature interactions:

- mini-player expands into fullscreen player with shared layout transition;
- album background crossfades on track change;
- queue items follow finger during reorder;
- presence avatars pulse only when meaningful: live, speaking, reacting, or syncing;
- search provider chips animate between loading/success/error states.

## Accessibility And UX

Minimum requirements:

- 44px touch targets;
- visible focus states;
- no hover-only controls;
- safe-area padding;
- predictable browser back behavior;
- no horizontal scroll on main screens;
- `min-h-dvh`, not raw `100vh`;
- reduced motion fallback;
- source labels are text, not only color.

## Loading And Empty States

Use skeletons instead of blocking spinners for:

- home feed
- search results
- playlist content
- profile stats

Use explicit degraded states for:

- provider unavailable
- source blocked
- proxy fallback active
- offline metadata only
- realtime reconnecting

## Design Quality Bar

Before a screen is considered done:

- it works at 375px width;
- it has empty/loading/error states;
- it has motion and reduced-motion behavior;
- text does not overlap;
- bottom controls avoid iOS home indicator;
- it has one distinctive product detail, not generic cards.
