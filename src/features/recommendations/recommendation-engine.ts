import { friends, tracks } from "@/features/player/mock-data";
import type { Track } from "@/features/player/types";

export type Recommendation = {
  track: Track;
  score: number;
  reason: string;
};

export function getRecommendations(seed: Track): Recommendation[] {
  const friendTrackIds = new Set(friends.map((friend) => friend.trackId));

  return tracks
    .filter((track) => track.id !== seed.id)
    .map((track) => {
      const tagOverlap = track.tags.filter((tag) => seed.tags.includes(tag)).length;
      const sameArtist = track.artist === seed.artist ? 1 : 0;
      const friendBoost = friendTrackIds.has(track.id) ? 0.22 : 0;
      const providerBoost = track.provider === "self-hosted" ? 0.12 : 0.06;
      const score = 0.42 + tagOverlap * 0.18 + sameArtist * 0.24 + friendBoost + providerBoost;

      const reason =
        friendTrackIds.has(track.id)
          ? "friends play this"
          : tagOverlap > 0
            ? `same vibe: ${track.tags.find((tag) => seed.tags.includes(tag))}`
            : "rare source pick";

      return {
        track,
        score: Math.min(score, 0.98),
        reason,
      };
    })
    .sort((a, b) => b.score - a.score);
}

