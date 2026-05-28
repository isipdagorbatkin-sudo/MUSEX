import { tracks } from "@/features/player/mock-data";
import type { MusicProvider, ProviderSearchRequest, ProviderSearchResult } from "./types";

function scoreTrack(query: string, track: (typeof tracks)[number]) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return 0.5;

  const haystack = [track.title, track.artist, track.album, track.providerLabel, ...track.tags].join(" ").toLowerCase();
  if (haystack.includes(normalized)) return 0.96;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const matched = tokens.filter((token) => haystack.includes(token)).length;
  return matched ? 0.55 + matched / tokens.length / 3 : 0.12;
}

function makeDemoProvider(id: string, label: string, priority: number): MusicProvider {
  return {
    id,
    label,
    priority,
    capabilities: ["search", "stream", "artwork", "resolve"],
    async search(request: ProviderSearchRequest) {
      return tracks
        .filter((track) => track.provider === id || scoreTrack(request.query, track) > 0.3)
        .map<ProviderSearchResult>((track) => ({
          ...track,
          providerTrackId: `${id}:${track.id}`,
          confidence: scoreTrack(request.query, track),
          sourceUrl: track.sourceUrl,
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, request.limit ?? 12);
    },
    async resolveStream(track) {
      return {
        providerId: id,
        providerTrackId: track.providerTrackId,
        url: track.sourceUrl,
        quality: "medium",
      };
    },
    async healthCheck() {
      return {
        ok: true,
        latencyMs: 80 + priority,
        failRate: 0.01,
        checkedAt: new Date().toISOString(),
      };
    },
  };
}

export const musicProviders: MusicProvider[] = [
  makeDemoProvider("self-hosted", "Self-hosted index", 10),
  makeDemoProvider("soundcloud-demo", "SoundCloud authorized", 20),
  makeDemoProvider("youtube-demo", "YouTube authorized", 30),
  makeDemoProvider("local", "Local library", 100),
].sort((a, b) => a.priority - b.priority);

export async function federatedSearch(request: ProviderSearchRequest) {
  const settled = await Promise.allSettled(
    musicProviders.map(async (provider) => {
      const started = performance.now();
      const results = await provider.search(request);
      const latencyPenalty = Math.min((performance.now() - started) / 1000, 0.2);

      return results.map((result) => ({
        ...result,
        confidence: result.confidence - provider.priority / 1000 - latencyPenalty,
      }));
    }),
  );

  const merged = new Map<string, ProviderSearchResult>();

  for (const group of settled) {
    if (group.status !== "fulfilled") continue;
    for (const result of group.value) {
      const fingerprint = `${result.title.toLowerCase()}::${result.artist.toLowerCase()}`;
      const previous = merged.get(fingerprint);
      if (!previous || result.confidence > previous.confidence) {
        merged.set(fingerprint, result);
      }
    }
  }

  return [...merged.values()].sort((a, b) => b.confidence - a.confidence).slice(0, request.limit ?? 20);
}

