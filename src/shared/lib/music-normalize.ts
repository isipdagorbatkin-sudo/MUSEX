import type { ProviderId, Track } from "@/features/player/types";

const palettes = [
  ["#ff5500", "#ffb86b"],
  ["#22c55e", "#5eead4"],
  ["#5e6ad2", "#f43f5e"],
  ["#f59e0b", "#22c55e"],
  ["#06b6d4", "#a78bfa"],
  ["#fb7185", "#fde047"],
];

export function makeWaveform(seed: string) {
  let value = 0;
  for (const char of seed) value += char.charCodeAt(0);

  return Array.from({ length: 18 }, (_, index) => {
    const next = Math.sin(value * (index + 3)) * 10000;
    return 24 + Math.abs(Math.floor(next) % 72);
  });
}

export function makeTrackId(provider: ProviderId, id: string | number) {
  return `${provider}-${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function makeCover(title: string, artist: string) {
  return `${title.trim()[0] ?? "M"}${artist.trim()[0] ?? "S"}`.toUpperCase();
}

export function makeAccentPair(seed: string) {
  let value = 0;
  for (const char of seed) value += char.charCodeAt(0);
  const [accent, accent2] = palettes[value % palettes.length];
  return { accent, accent2 };
}

export function normalizeTrack(input: {
  id: string | number;
  title: string;
  artist: string;
  album?: string | null;
  duration?: number | null;
  sourceUrl: string;
  provider: ProviderId;
  providerLabel: string;
  artworkUrl?: string;
  externalUrl?: string;
  tags?: string[];
}): Track {
  const seed = `${input.provider}:${input.id}:${input.title}:${input.artist}`;
  const { accent, accent2 } = makeAccentPair(seed);

  return {
    id: makeTrackId(input.provider, input.id),
    title: input.title || "Unknown track",
    artist: input.artist || "Unknown artist",
    album: input.album || "Single",
    duration: input.duration || 30,
    sourceUrl: input.sourceUrl,
    provider: input.provider,
    providerLabel: input.providerLabel,
    artworkUrl: input.artworkUrl,
    externalUrl: input.externalUrl,
    accent,
    accent2,
    cover: makeCover(input.title, input.artist),
    waveform: makeWaveform(seed),
    tags: input.tags ?? [input.providerLabel.toLowerCase(), "preview"],
  };
}

