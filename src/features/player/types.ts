export type ProviderId = "itunes" | "deezer" | "soundcloud-demo" | "youtube-demo" | "self-hosted" | "local";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  sourceUrl: string;
  provider: ProviderId;
  providerLabel: string;
  artworkUrl?: string;
  externalUrl?: string;
  accent: string;
  accent2: string;
  cover: string;
  waveform: number[];
  tags: string[];
};

export type FriendActivity = {
  id: string;
  name: string;
  handle: string;
  trackId: string;
  status: "live" | "recent" | "syncing";
  compatibility: number;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  coverTrackId?: string;
  trackIds: string[];
  createdAt: string;
};

export type RepeatMode = "off" | "one" | "all";

export type EqPreset = "flat" | "rock" | "pop" | "classic" | "bass" | "vocal";

export type HistoryEntry = {
  trackId: string;
  playedAt: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
};
