import type { Track } from "@/features/player/types";

export type ProviderCapability = "search" | "stream" | "artwork" | "lyrics" | "resolve";

export type ProviderHealth = {
  ok: boolean;
  latencyMs: number;
  failRate: number;
  checkedAt: string;
};

export type ProviderSearchRequest = {
  query: string;
  limit?: number;
  region?: string;
};

export type ProviderSearchResult = Track & {
  providerTrackId: string;
  confidence: number;
  artworkUrl?: string;
  sourceUrl?: string;
};

export type StreamCandidate = {
  providerId: string;
  providerTrackId: string;
  url: string;
  expiresAt?: string;
  quality?: "low" | "medium" | "high" | "lossless";
  requiresProxy?: boolean;
};

export type MusicProvider = {
  id: string;
  label: string;
  priority: number;
  capabilities: ProviderCapability[];
  search(request: ProviderSearchRequest): Promise<ProviderSearchResult[]>;
  resolveStream?(track: ProviderSearchResult): Promise<StreamCandidate | null>;
  healthCheck?(): Promise<ProviderHealth>;
};

