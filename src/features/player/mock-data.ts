import type { FriendActivity, Track } from "./types";

export const tracks: Track[] = [
  {
    id: "midnight-signal",
    title: "Midnight Signal",
    artist: "Noir Relay",
    album: "Afterimage Club",
    duration: 348,
    sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    provider: "self-hosted",
    providerLabel: "Локальный каталог",
    accent: "#ff5500",
    accent2: "#5eead4",
    cover: "MS",
    tags: ["wave", "night drive", "friends"],
    waveform: [18, 42, 28, 64, 52, 88, 44, 75, 38, 92, 58, 34, 72, 46, 86, 60],
  },
  {
    id: "glass-frequency",
    title: "Glass Frequency",
    artist: "Sable Choir",
    album: "Private Index",
    duration: 282,
    sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    provider: "self-hosted",
    providerLabel: "Локальный каталог",
    accent: "#5e6ad2",
    accent2: "#f43f5e",
    cover: "GF",
    tags: ["edit", "cinematic", "late"],
    waveform: [44, 28, 76, 35, 90, 55, 38, 64, 80, 42, 58, 96, 32, 72, 48, 84],
  },
  {
    id: "north-cache",
    title: "North Cache",
    artist: "Kito Lumen",
    album: "Relay Tapes",
    duration: 416,
    sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    provider: "self-hosted",
    providerLabel: "Локальный каталог",
    accent: "#f59e0b",
    accent2: "#22c55e",
    cover: "NC",
    tags: ["self-hosted", "rare", "lossless"],
    waveform: [26, 38, 50, 82, 70, 44, 32, 88, 60, 74, 46, 92, 40, 66, 78, 36],
  },
  {
    id: "static-bloom",
    title: "Static Bloom",
    artist: "Mira Vox",
    album: "Room Tone",
    duration: 321,
    sourceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    provider: "local",
    providerLabel: "Файл на устройстве",
    accent: "#a78bfa",
    accent2: "#5eead4",
    cover: "SB",
    tags: ["local", "dream pop", "sync"],
    waveform: [58, 34, 86, 42, 72, 95, 48, 66, 30, 78, 56, 88, 44, 62, 90, 36],
  },
];

export const friends: FriendActivity[] = [
  { id: "anya", name: "Аня", handle: "@anya", trackId: "midnight-signal", status: "live", compatibility: 92 },
  { id: "tim", name: "Тим", handle: "@tim", trackId: "glass-frequency", status: "syncing", compatibility: 86 },
  { id: "max", name: "Макс", handle: "@max", trackId: "north-cache", status: "recent", compatibility: 78 },
];

export function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
