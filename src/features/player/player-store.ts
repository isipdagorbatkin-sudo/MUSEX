"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tracks } from "./mock-data";
import type { EqPreset, HistoryEntry, Playlist, RepeatMode, Track, UserProfile } from "./types";

type PlayerState = {
  queue: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  isFullscreen: boolean;
  query: string;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  eqPreset: EqPreset;
  progress: number;
  duration: number;
  likedTrackIds: string[];
  dislikedTrackIds: string[];
  ratings: Record<string, number>;
  history: HistoryEntry[];
  playCounts: Record<string, number>;
  playlists: Playlist[];
  profile: UserProfile;
  theme: "dark" | "light";
  setQuery: (query: string) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setFullscreen: (open: boolean) => void;
  addNext: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  moveQueueTrack: (fromIndex: number, toIndex: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setEqPreset: (preset: EqPreset) => void;
  setProgress: (progress: number, duration?: number) => void;
  seekTo: (seconds: number) => void;
  toggleLike: (track: Track) => void;
  toggleDislike: (track: Track) => void;
  rateTrack: (trackId: string, rating: number) => void;
  createPlaylist: (title: string, description?: string) => string;
  renamePlaylist: (playlistId: string, title: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  saveQueueAsPlaylist: (title: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addLocalTrack: (track: Track) => void;
  addLocalTracks: (items: Track[]) => void;
  recordPlay: (track: Track) => void;
  toggleTheme: () => void;
};

const defaultProfile: UserProfile = {
  username: "denis.music",
  displayName: "Денис",
  bio: "Личная музыкальная база: лайки, редкие находки, плейлисты и совместное прослушивание.",
  avatar: "Д",
  followers: 128,
  following: 42,
};

function boundedVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function currentIndex(queue: Track[], currentTrack: Track) {
  return Math.max(0, queue.findIndex((track) => track.id === currentTrack.id));
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: tracks,
      currentTrack: tracks[0],
      isPlaying: false,
      isFullscreen: false,
      query: "",
      volume: 0.86,
      isMuted: false,
      repeatMode: "off",
      isShuffle: false,
      eqPreset: "flat",
      progress: 0,
      duration: tracks[0].duration,
      likedTrackIds: [],
      dislikedTrackIds: [],
      ratings: {},
      history: [],
      playCounts: {},
      playlists: [
        {
          id: "night-drive",
          title: "Ночной вайб",
          description: "Темные, быстрые, глянцевые треки.",
          coverTrackId: tracks[0].id,
          trackIds: [tracks[0].id, tracks[1].id],
          createdAt: new Date().toISOString(),
        },
      ],
      profile: defaultProfile,
      theme: "dark",
      setQuery: (query) => set({ query }),
      playTrack: (track) =>
        set((state) => ({
          currentTrack: track,
          isPlaying: true,
          progress: 0,
          duration: track.duration,
          queue: state.queue.some((item) => item.id === track.id) ? state.queue : [track, ...state.queue],
        })),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      stop: () => {
        document.querySelector("audio")?.pause();
        const audio = document.querySelector("audio");
        if (audio) audio.currentTime = 0;
        set({ isPlaying: false, progress: 0 });
      },
      next: () => {
        const { queue, currentTrack, isShuffle, repeatMode } = get();
        if (!queue.length) return;
        if (repeatMode === "one") {
          set({ progress: 0, isPlaying: true });
          const audio = document.querySelector("audio");
          if (audio) audio.currentTime = 0;
          return;
        }
        const index = currentIndex(queue, currentTrack);
        const nextIndex = isShuffle ? Math.floor(Math.random() * queue.length) : index + 1;
        if (nextIndex >= queue.length && repeatMode !== "all") {
          set({ isPlaying: false, progress: 0 });
          return;
        }
        const nextTrack = queue[nextIndex % queue.length];
        set({ currentTrack: nextTrack, isPlaying: true, progress: 0, duration: nextTrack.duration });
      },
      previous: () => {
        const { queue, currentTrack } = get();
        if (!queue.length) return;
        const index = currentIndex(queue, currentTrack);
        const previousTrack = queue[(index - 1 + queue.length) % queue.length];
        set({ currentTrack: previousTrack, isPlaying: true, progress: 0, duration: previousTrack.duration });
      },
      setFullscreen: (open) => set({ isFullscreen: open }),
      addNext: (track) => {
        const { queue, currentTrack } = get();
        const index = currentIndex(queue, currentTrack);
        const nextQueue = queue.filter((item) => item.id !== track.id);
        nextQueue.splice(index + 1, 0, track);
        set({ queue: nextQueue });
      },
      removeFromQueue: (trackId) =>
        set((state) => ({
          queue: state.queue.filter((track) => track.id !== trackId),
        })),
      moveQueueTrack: (fromIndex, toIndex) =>
        set((state) => {
          const queue = [...state.queue];
          const [item] = queue.splice(fromIndex, 1);
          if (!item) return state;
          queue.splice(toIndex, 0, item);
          return { queue };
        }),
      setVolume: (volume) => set({ volume: boundedVolume(volume), isMuted: volume <= 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
      setEqPreset: (preset) => set({ eqPreset: preset }),
      setProgress: (progress, duration) => set((state) => ({ progress, duration: duration ?? state.duration })),
      seekTo: (seconds) => {
        const audio = document.querySelector("audio");
        if (audio) audio.currentTime = seconds;
        set({ progress: seconds });
      },
      toggleLike: (track) =>
        set((state) => ({
          likedTrackIds: state.likedTrackIds.includes(track.id)
            ? state.likedTrackIds.filter((id) => id !== track.id)
            : [track.id, ...state.likedTrackIds],
          dislikedTrackIds: state.dislikedTrackIds.filter((id) => id !== track.id),
          queue: state.queue.some((item) => item.id === track.id) ? state.queue : [track, ...state.queue],
        })),
      toggleDislike: (track) =>
        set((state) => ({
          dislikedTrackIds: state.dislikedTrackIds.includes(track.id)
            ? state.dislikedTrackIds.filter((id) => id !== track.id)
            : [track.id, ...state.dislikedTrackIds],
          likedTrackIds: state.likedTrackIds.filter((id) => id !== track.id),
        })),
      rateTrack: (trackId, rating) =>
        set((state) => ({ ratings: { ...state.ratings, [trackId]: Math.min(5, Math.max(1, rating)) } })),
      createPlaylist: (title, description = "") => {
        const id = crypto.randomUUID();
        set((state) => ({
          playlists: [
            {
              id,
              title: title.trim() || "Новый плейлист",
              description,
              trackIds: [],
              createdAt: new Date().toISOString(),
            },
            ...state.playlists,
          ],
        }));
        return id;
      },
      renamePlaylist: (playlistId, title) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) => (playlist.id === playlistId ? { ...playlist, title: title.trim() || playlist.title } : playlist)),
        })),
      deletePlaylist: (playlistId) =>
        set((state) => ({
          playlists: state.playlists.filter((playlist) => playlist.id !== playlistId),
        })),
      addToPlaylist: (playlistId, track) =>
        set((state) => ({
          queue: state.queue.some((item) => item.id === track.id) ? state.queue : [track, ...state.queue],
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  coverTrackId: playlist.coverTrackId ?? track.id,
                  trackIds: playlist.trackIds.includes(track.id) ? playlist.trackIds : [...playlist.trackIds, track.id],
                }
              : playlist,
          ),
        })),
      saveQueueAsPlaylist: (title) =>
        set((state) => ({
          playlists: [
            {
              id: crypto.randomUUID(),
              title: title.trim() || "Очередь",
              description: "Сохранено из текущей очереди",
              coverTrackId: state.currentTrack.id,
              trackIds: state.queue.map((track) => track.id),
              createdAt: new Date().toISOString(),
            },
            ...state.playlists,
          ],
        })),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      addLocalTrack: (track) =>
        set((state) => ({
          currentTrack: track,
          isPlaying: true,
          queue: [track, ...state.queue.filter((item) => item.id !== track.id)],
        })),
      addLocalTracks: (items) =>
        set((state) => ({
          currentTrack: items[0] ?? state.currentTrack,
          isPlaying: Boolean(items[0]) || state.isPlaying,
          queue: [...items, ...state.queue.filter((track) => !items.some((item) => item.id === track.id))],
        })),
      recordPlay: (track) =>
        set((state) => ({
          history: [{ trackId: track.id, playedAt: new Date().toISOString() }, ...state.history].slice(0, 200),
          playCounts: { ...state.playCounts, [track.id]: (state.playCounts[track.id] ?? 0) + 1 },
        })),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "musecs-player",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        repeatMode: state.repeatMode,
        isShuffle: state.isShuffle,
        eqPreset: state.eqPreset,
        likedTrackIds: state.likedTrackIds,
        dislikedTrackIds: state.dislikedTrackIds,
        ratings: state.ratings,
        history: state.history,
        playCounts: state.playCounts,
        playlists: state.playlists,
        profile: state.profile,
        theme: state.theme,
      }),
    },
  ),
);
