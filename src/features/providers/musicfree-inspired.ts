import type { MusicProvider, ProviderSearchRequest, ProviderSearchResult } from "./types";

export const musicProviders: MusicProvider[] = [];

export async function federatedSearch(request: ProviderSearchRequest) {
  if (!musicProviders.length) return [] satisfies ProviderSearchResult[];

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
