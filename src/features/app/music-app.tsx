"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AudioWaveform,
  ChevronDown,
  Compass,
  GripVertical,
  Heart,
  Home,
  Library,
  ListMusic,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Star,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthDock } from "@/features/auth/auth-dock";
import { AudioEngine } from "@/features/player/audio-engine";
import { emptyTrack, usePlayerStore } from "@/features/player/player-store";
import type { Track } from "@/features/player/types";
import { cn } from "@/shared/lib/cn";
import { formatTime } from "@/shared/lib/format-time";

type AppView = "home" | "wave" | "player" | "profile" | "library";

type RecommendationBlock = {
  id: string;
  title: string;
  tracks: Track[];
};

const presetLabels = {
  flat: "Ровно",
  rock: "Рок",
  pop: "Поп",
  classic: "Классика",
  bass: "Басс",
  vocal: "Вокал",
};

export function MusicApp() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isFullscreen = usePlayerStore((state) => state.isFullscreen);
  const [activeView, setActiveView] = useState<AppView>("home");

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 8%, ${currentTrack.accent}26, transparent 30rem), radial-gradient(circle at 85% 18%, ${currentTrack.accent2}20, transparent 28rem), linear-gradient(180deg, #07070a 0%, #020203 68%)`,
      }}
    >
      <AudioEngine />
      <AmbientBackdrop track={currentTrack} />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28 pt-4 sm:max-w-lg">
        <TopBar />
        {activeView === "home" ? <HomeView setActiveView={setActiveView} /> : null}
        {activeView === "wave" ? <WaveView /> : null}
        {activeView === "player" ? <PlayerView /> : null}
        {activeView === "profile" ? <ProfileView /> : null}
        {activeView === "library" ? <LibraryView /> : null}
      </div>

      <MiniPlayer />
      <BottomNav activeView={activeView} setActiveView={setActiveView} />
      <AnimatePresence>{isFullscreen ? <FullscreenPlayer /> : null}</AnimatePresence>
    </main>
  );
}

function AmbientBackdrop({ track }: { track: Track }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-8 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: track.accent }}
        animate={{ x: [0, 28, -16, 0], y: [0, 20, 12, 0], opacity: [0.1, 0.18, 0.12, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-28 top-40 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: track.accent2 }}
        animate={{ x: [0, -26, 18, 0], y: [0, -18, 22, 0], opacity: [0.08, 0.15, 0.1, 0.08] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-orange-300">MUSECS</p>
        <h1 className="text-2xl font-semibold tracking-tight">Музыка из API</h1>
      </div>
      <button className="glass-panel grid h-11 w-11 place-items-center rounded-full" aria-label="Активность">
        <Activity size={19} />
      </button>
    </header>
  );
}

function HomeView({ setActiveView }: { setActiveView: (view: AppView) => void }) {
  return (
    <>
      <SearchPanel />
      <HeroPlayer />
      <section className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => setActiveView("wave")} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4 text-left">
          <Sparkles size={20} className="text-orange-300" />
          <p className="mt-4 text-sm font-semibold">Моя волна</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">По лайкам и Last.fm</p>
        </button>
        <button onClick={() => setActiveView("library")} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4 text-left">
          <Library size={20} className="text-cyan-200" />
          <p className="mt-4 text-sm font-semibold">Библиотека</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Плейлисты и лайки</p>
        </button>
      </section>
      <RecommendationFeed />
    </>
  );
}

function SearchPanel() {
  const query = usePlayerStore((state) => state.query);
  const setQuery = usePlayerStore((state) => state.setQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSearching = query.trim().length >= 2;
  const visibleResults = isSearching ? results : [];

  useEffect(() => {
    const value = query.trim();
    const controller = new AbortController();

    if (value.length < 2) {
      return () => controller.abort();
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { tracks: Track[] };
        setResults(data.tracks);
      } catch {
        if (!controller.signal.aborted) setError("Источник поиска не ответил. Попробуй другой запрос.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <section className="mt-3">
      <label className="flex h-16 items-center gap-3 rounded-[22px] border border-white/10 bg-[#111116] px-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <Search size={19} className="text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти трек или артиста"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-muted)]"
        />
        {isSearching && isLoading ? <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" /> : null}
      </label>

      {isSearching && error ? <p className="mt-3 rounded-2xl bg-rose-400/10 p-3 text-xs text-rose-100">{error}</p> : null}
      {isSearching ? (
        <div className="mt-3 space-y-2">
          {!isLoading && visibleResults.length === 0 ? <EmptyState text="Ничего не найдено. Попробуй другой запрос." /> : null}
          {visibleResults.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RecommendationFeed() {
  const [blocks, setBlocks] = useState<RecommendationBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/music/recommendations", { signal: controller.signal });
        if (!response.ok) throw new Error("Recommendations failed");
        const data = (await response.json()) as { blocks: RecommendationBlock[] };
        setBlocks(data.blocks);
      } catch {
        if (!controller.signal.aborted) setBlocks([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <section className="mt-5">
        <h2 className="mb-3 text-sm font-medium text-zinc-200">Рекомендации</h2>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 min-w-40 animate-pulse rounded-[22px] bg-white/[0.055]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {blocks.map((block) => (
        <section key={block.id} className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-200">{block.title}</h2>
            <Sparkles size={18} className="text-orange-300" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
            {block.tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className="min-w-44 rounded-[22px] border border-white/10 bg-white/[0.055] p-3 text-left shadow-[0_18px_52px_rgba(0,0,0,0.22)]"
      onClick={() => usePlayerStore.getState().playTrack(track)}
    >
      <Cover track={track} />
      <div className="mt-3 min-w-0">
        <p className="truncate text-sm font-semibold">{track.title}</p>
        <p className="truncate text-xs text-[var(--text-muted)]">{track.artist}</p>
      </div>
      <p className="mt-2 truncate text-[11px] text-orange-200">{track.providerLabel}</p>
    </motion.button>
  );
}

function HeroPlayer() {
  const track = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setFullscreen = usePlayerStore((state) => state.setFullscreen);
  const hasTrack = track.id !== emptyTrack.id && Boolean(track.sourceUrl);

  return (
    <section className="mt-4 rounded-[28px] border border-white/10 bg-[#0d0d12]/95 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
      <button onClick={() => hasTrack && setFullscreen(true)} className="block w-full rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
        <div className="flex gap-4">
          <Cover track={track} size="lg" />
          <div className="min-w-0 flex-1 py-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-zinc-200">{track.providerLabel}</span>
              <span className="flex items-center gap-1 text-[11px] text-orange-200">
                <Radio size={12} /> {hasTrack ? "готово" : "выбери трек"}
              </span>
            </div>
            <h2 className="truncate text-2xl font-semibold tracking-tight">{track.title}</h2>
            <p className="truncate text-sm text-[var(--text-secondary)]">{track.artist}</p>
            <Waveform track={track} compact />
          </div>
        </div>
      </button>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => usePlayerStore.getState().toggleShuffle()} className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-zinc-200" aria-label="Перемешать">
          <Shuffle size={18} />
        </button>
        <button
          onClick={togglePlay}
          disabled={!hasTrack}
          className="grid h-16 w-16 place-items-center rounded-full text-zinc-950 shadow-[0_0_36px_rgba(255,85,0,0.35)] disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${track.accent}, ${track.accent2})` }}
          aria-label={isPlaying ? "Пауза" : "Играть"}
        >
          {isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={() => usePlayerStore.getState().setFullscreen(true)} className="grid h-12 w-12 place-items-center rounded-full bg-white/8 text-zinc-200" aria-label="Открыть плеер">
          <ListMusic size={18} />
        </button>
      </div>
    </section>
  );
}

function Cover({ track, size = "md" }: { track: Track; size?: "md" | "lg" | "xl" }) {
  const [failed, setFailed] = useState(false);
  const pixels = size === "xl" ? 288 : size === "lg" ? 128 : 64;

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-[24px] font-semibold text-zinc-950 shadow-2xl",
        size === "md" && "h-16 w-16 text-lg",
        size === "lg" && "h-32 w-32 text-3xl",
        size === "xl" && "h-64 w-full max-w-72 text-6xl",
      )}
      style={{ background: `linear-gradient(145deg, ${track.accent}, ${track.accent2})`, boxShadow: `0 24px 90px ${track.accent}30` }}
    >
      {track.artworkUrl && !failed ? (
        <Image src={track.artworkUrl} alt={`${track.title} artwork`} width={pixels} height={pixels} unoptimized className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        track.cover
      )}
    </div>
  );
}

function Waveform({ track, compact = false }: { track: Track; compact?: boolean }) {
  return (
    <div className={cn("mt-5 flex items-end gap-1", compact ? "h-12" : "h-20")}>
      {track.waveform.map((bar, index) => (
        <motion.div
          key={`${track.id}-${index}`}
          className="flex-1 rounded-full"
          style={{ height: `${Math.max(14, bar)}%`, background: index < 7 ? `linear-gradient(180deg, ${track.accent2}, ${track.accent})` : "rgba(255,255,255,0.18)" }}
          initial={{ scaleY: 0.2, opacity: 0.35 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: index * 0.018, duration: 0.28 }}
        />
      ))}
    </div>
  );
}

function TrackRow({ track }: { track: Track }) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);
  const playlists = usePlayerStore((state) => state.playlists);
  const isCurrent = currentTrack.id === track.id;
  const isLiked = likedTrackIds.includes(track.id);

  return (
    <motion.div layout className={cn("flex items-center gap-3 rounded-[20px] p-2", isCurrent ? "bg-white/12 shadow-[0_0_0_1px_rgba(255,85,0,0.24)]" : "bg-white/[0.035]")}>
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => usePlayerStore.getState().playTrack(track)}>
        <Cover track={track} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.title}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{track.artist} · {track.providerLabel}</p>
        </div>
      </button>
      <span className="font-mono text-xs text-[var(--text-muted)]">{formatTime(track.duration)}</span>
      <button onClick={() => usePlayerStore.getState().toggleLike(track)} className={cn("grid h-10 w-10 place-items-center rounded-full", isLiked ? "bg-orange-400 text-zinc-950" : "bg-white/8")} aria-label="Лайк">
        <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
      </button>
      <button
        onClick={() => {
          usePlayerStore.getState().addNext(track);
          if (playlists[0]) usePlayerStore.getState().addToPlaylist(playlists[0].id, track);
        }}
        className="grid h-10 w-10 place-items-center rounded-full bg-white/8"
        aria-label="Добавить"
      >
        <Plus size={17} />
      </button>
    </motion.div>
  );
}

function WaveView() {
  const queue = usePlayerStore((state) => state.queue);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const likedSeed = queue.find((track) => likedTrackIds.includes(track.id));
  const seedTrack = likedSeed ?? (currentTrack.id !== emptyTrack.id ? currentTrack : null);
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!seedTrack) {
      return;
    }
    const controller = new AbortController();

    async function loadWave() {
      if (!seedTrack) return;
      setIsLoading(true);
      try {
        const tags = seedTrack.tags.slice(0, 3).join(",");
        const waveResponse = await fetch(`/api/music/lastfm/wave?artist=${encodeURIComponent(seedTrack.artist)}&track=${encodeURIComponent(seedTrack.title)}&tags=${encodeURIComponent(tags)}`, { signal: controller.signal });
        const waveData = (await waveResponse.json()) as { seeds?: string[] };
        const seeds = waveData.seeds?.length ? waveData.seeds : [`${seedTrack.artist} ${seedTrack.title}`, ...seedTrack.tags];
        const groups = await Promise.all(
          seeds.slice(0, 8).map(async (seed) => {
            const response = await fetch(`/api/music/search?q=${encodeURIComponent(seed)}`, { signal: controller.signal });
            if (!response.ok) return [];
            const data = (await response.json()) as { tracks: Track[] };
            return data.tracks.slice(0, 2);
          }),
        );
        const unique = new Map<string, Track>();
        for (const track of groups.flat()) {
          const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
          if (!unique.has(key)) unique.set(key, track);
        }
        setResults([...unique.values()].slice(0, 18));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadWave();
    return () => controller.abort();
  }, [seedTrack]);

  return (
    <>
      <section className="mt-3 rounded-[30px] border border-white/10 bg-[#0d0d12]/90 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-300">Last.fm + API</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Моя волна</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Похожие треки появятся после лайков или первого прослушивания.</p>
      </section>
      <div className="mt-4 space-y-2">
        {!seedTrack ? <EmptyState text="Пока нет базы для рекомендаций. Найди трек, включи его или поставь лайк." /> : null}
        {isLoading ? [0, 1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-[20px] bg-white/[0.055]" />) : null}
        {!isLoading && seedTrack ? results.map((track) => <TrackRow key={track.id} track={track} />) : null}
      </div>
    </>
  );
}

function PlayerView() {
  return (
    <>
      <HeroPlayer />
      <AdvancedPlayerPanel />
      <MetadataPanel />
      <QueuePanel />
    </>
  );
}

function AdvancedPlayerPanel() {
  const track = usePlayerStore((state) => state.currentTrack);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const eqPreset = usePlayerStore((state) => state.eqPreset);
  const ratings = usePlayerStore((state) => state.ratings);

  return (
    <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-200">Звук и режимы</h2>
        <div className="flex gap-2">
          <IconToggle active={isShuffle} label="Случайный порядок" onClick={() => usePlayerStore.getState().toggleShuffle()}>
            <Shuffle size={17} />
          </IconToggle>
          <IconToggle
            active={repeatMode !== "off"}
            label="Повтор"
            onClick={() => {
              const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
              usePlayerStore.getState().setRepeatMode(nextMode);
            }}
          >
            {repeatMode === "one" ? <Repeat1 size={17} /> : <Repeat size={17} />}
          </IconToggle>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={() => usePlayerStore.getState().toggleMute()} className="grid h-11 w-11 place-items-center rounded-full bg-white/8" aria-label="Без звука">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(event) => usePlayerStore.getState().setVolume(Number(event.target.value))} className="min-w-0 flex-1 accent-orange-400" aria-label="Громкость" />
        <button onClick={() => usePlayerStore.getState().stop()} className="grid h-11 w-11 place-items-center rounded-full bg-white/8" aria-label="Стоп">
          <Square size={16} fill="currentColor" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {(["flat", "rock", "pop", "classic", "bass", "vocal"] as const).map((preset) => (
          <button key={preset} onClick={() => usePlayerStore.getState().setEqPreset(preset)} className={cn("h-9 rounded-full px-3 text-xs", eqPreset === preset ? "bg-orange-400 text-zinc-950" : "bg-white/8 text-zinc-300")}>
            {presetLabels[preset]}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1" aria-label="Рейтинг трека">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button key={rating} onClick={() => usePlayerStore.getState().rateTrack(track.id, rating)} className="grid h-9 w-9 place-items-center rounded-full bg-white/8">
              <Star size={16} fill={(ratings[track.id] ?? 0) >= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <button onClick={() => usePlayerStore.getState().toggleDislike(track)} className="h-9 rounded-full bg-white/8 px-3 text-xs text-zinc-300">
          Дизлайк
        </button>
      </div>
    </section>
  );
}

function IconToggle({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("grid h-10 w-10 place-items-center rounded-full", active ? "bg-orange-400 text-zinc-950" : "bg-white/8 text-zinc-200")} aria-label={label}>
      {children}
    </button>
  );
}

function QueuePanel() {
  const queue = usePlayerStore((state) => state.queue);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Очередь</h2>
          <p className="text-xs text-[var(--text-muted)]">Треки появляются после поиска или рекомендаций.</p>
        </div>
        <button onClick={() => usePlayerStore.getState().saveQueueAsPlaylist("Моя очередь")} disabled={!queue.length} className="h-9 rounded-full bg-white px-3 text-xs font-medium text-zinc-950 disabled:opacity-40">
          Сохранить
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {!queue.length ? <EmptyState text="Очередь пустая." /> : null}
        {queue.map((track, index) => (
          <div
            key={track.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) usePlayerStore.getState().moveQueueTrack(dragIndex, index);
              setDragIndex(null);
            }}
            className={cn("flex items-center gap-3 rounded-2xl bg-white/[0.035] p-2", currentTrack.id === track.id && "bg-orange-400/12")}
          >
            <GripVertical size={16} className="text-[var(--text-muted)]" />
            <button className="min-w-0 flex-1 text-left" onClick={() => usePlayerStore.getState().playTrack(track)}>
              <p className="truncate text-sm">{track.title}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{track.artist}</p>
            </button>
            <button onClick={() => usePlayerStore.getState().removeFromQueue(track.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white/8" aria-label="Удалить">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetadataPanel() {
  const track = usePlayerStore((state) => state.currentTrack);
  const playCounts = usePlayerStore((state) => state.playCounts);
  const history = usePlayerStore((state) => state.history);
  const queue = usePlayerStore((state) => state.queue);
  const recent = history.slice(0, 5);

  return (
    <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Метаданные</h2>
          <p className="text-xs text-[var(--text-muted)]">{track.album} · {formatTime(track.duration)}</p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1 text-xs">{playCounts[track.id] ?? 0} plays</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {track.tags.length ? track.tags.map((tag) => <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] text-zinc-300">#{tag}</span>) : <span className="text-xs text-[var(--text-muted)]">Тегов пока нет.</span>}
      </div>
      <div className="mt-4 rounded-2xl bg-black/20 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Текст песни</p>
        <p className="mt-2 text-sm text-zinc-300">Lyrics подключим отдельным API, когда выберем источник текстов.</p>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">История</p>
        {recent.length ? (
          <div className="space-y-1">
            {recent.map((entry) => {
              const item = queue.find((queueTrack) => queueTrack.id === entry.trackId);
              return item ? <p key={`${entry.trackId}-${entry.playedAt}`} className="truncate text-xs text-zinc-400">{item.artist} · {item.title}</p> : null;
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">История появится после прослушивания.</p>
        )}
      </div>
    </section>
  );
}

function ProfileView() {
  const profile = usePlayerStore((state) => state.profile);
  const likedTrackIds = usePlayerStore((state) => state.likedTrackIds);
  const playlists = usePlayerStore((state) => state.playlists);
  const queue = usePlayerStore((state) => state.queue);
  const likedTracks = queue.filter((track) => likedTrackIds.includes(track.id));
  const topArtists = [...new Set(likedTracks.map((track) => track.artist))].slice(0, 4);
  const savedMinutes = Math.round(queue.reduce((total, track) => total + (track.duration || 0), 0) / 60);
  const displayName = profile.displayName || "Профиль не заполнен";
  const avatar = profile.avatar || "M";

  return (
    <>
      <section className="mt-3 overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d12]/90 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-cyan-300 text-3xl font-black text-zinc-950">{avatar}</div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{profile.username ? `@${profile.username}` : "после входа через Supabase"}</p>
            <h2 className="truncate text-3xl font-semibold tracking-tight">{displayName}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{profile.bio || "Пока нет био, лайков и любимых артистов."}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="лайков" value={likedTrackIds.length} />
          <Stat label="плейлистов" value={playlists.length} />
          <Stat label="минут" value={savedMinutes} />
        </div>
      </section>
      <section className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
        <h2 className="text-sm font-medium text-zinc-200">Музыкальный профиль</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ProfileMetric label="Любимые артисты" value={topArtists.length ? topArtists.join(", ") : "Пока пусто"} />
          <ProfileMetric label="Коллекция" value={`${queue.length} треков в очереди`} />
          <ProfileMetric label="Соцсвязь" value={`${profile.followers} подписчиков · ${profile.following} подписок`} />
          <ProfileMetric label="Вайб" value={likedTracks[0]?.tags.slice(0, 2).join(", ") || "Появится после лайков"} />
        </div>
      </section>
      <section className="mt-5">
        <h2 className="mb-3 text-sm font-medium text-zinc-200">Лайкнутые треки</h2>
        <div className="space-y-2">
          {likedTracks.length ? likedTracks.map((track) => <TrackRow key={track.id} track={track} />) : <EmptyState text="Пока нет лайкнутых треков." />}
        </div>
      </section>
      <AuthDock />
    </>
  );
}

function LibraryView() {
  const playlists = usePlayerStore((state) => state.playlists);
  const [title, setTitle] = useState("");

  return (
    <>
      <section className="mt-3 rounded-[28px] border border-white/10 bg-[#0d0d12]/90 p-4">
        <h2 className="text-2xl font-semibold tracking-tight">Библиотека</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Плейлисты появятся после создания или сохранения очереди.</p>
        <div className="mt-4 flex gap-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Новый плейлист" className="h-11 min-w-0 flex-1 rounded-2xl bg-white/8 px-3 text-sm outline-none placeholder:text-[var(--text-muted)]" />
          <button
            className="h-11 rounded-2xl bg-white px-4 text-sm font-medium text-zinc-950"
            onClick={() => {
              usePlayerStore.getState().createPlaylist(title);
              setTitle("");
            }}
          >
            Создать
          </button>
        </div>
      </section>
      <section className="mt-5 grid grid-cols-2 gap-3">
        {playlists.length ? playlists.map((playlist) => <PlaylistCard key={playlist.id} playlistId={playlist.id} />) : <div className="col-span-2"><EmptyState text="Плейлистов пока нет." /></div>}
      </section>
    </>
  );
}

function PlaylistCard({ playlistId }: { playlistId: string }) {
  const playlist = usePlayerStore((state) => state.playlists.find((item) => item.id === playlistId));
  const queue = usePlayerStore((state) => state.queue);
  if (!playlist) return null;
  const coverTrack = queue.find((track) => track.id === playlist.coverTrackId) ?? queue.find((track) => playlist.trackIds.includes(track.id)) ?? emptyTrack;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="rounded-[24px] border border-white/10 bg-white/[0.045] p-3 text-left"
      onClick={() => {
        const first = queue.find((track) => playlist.trackIds.includes(track.id));
        if (first) usePlayerStore.getState().playTrack(first);
      }}
    >
      <Cover track={coverTrack} />
      <p className="mt-3 truncate text-sm font-semibold">{playlist.title}</p>
      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{playlist.trackIds.length} треков</p>
    </motion.button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.055] p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-100">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-[var(--text-muted)]">{text}</div>;
}

function MiniPlayer() {
  const track = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setFullscreen = usePlayerStore((state) => state.setFullscreen);
  const hasTrack = track.id !== emptyTrack.id && Boolean(track.sourceUrl);

  if (!hasTrack) return null;

  return (
    <motion.div layoutId="mini-player" className="fixed inset-x-3 bottom-[5.7rem] z-30 mx-auto max-w-md" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <div className="glass-panel flex items-center gap-3 rounded-2xl p-2">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setFullscreen(true)}>
          <Cover track={track} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{track.title}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{track.artist}</p>
          </div>
        </button>
        <button onClick={togglePlay} className="grid h-12 w-12 place-items-center rounded-full bg-white text-zinc-950" aria-label={isPlaying ? "Пауза" : "Играть"}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
    </motion.div>
  );
}

function BottomNav({ activeView, setActiveView }: { activeView: AppView; setActiveView: (view: AppView) => void }) {
  const items = [
    { icon: Home, label: "Главная", view: "home" as const },
    { icon: Sparkles, label: "Моя волна", view: "wave" as const },
    { icon: AudioWaveform, label: "Плеер", view: "player" as const },
    { icon: Compass, label: "Профиль", view: "profile" as const },
    { icon: Library, label: "Библиотека", view: "library" as const },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-3">
      <div className="glass-panel grid grid-cols-5 rounded-[24px] p-2">
        {items.map((item) => (
          <button key={item.label} onClick={() => setActiveView(item.view)} className={cn("grid h-12 place-items-center rounded-2xl", activeView === item.view && "bg-white text-zinc-950")} aria-label={item.label}>
            <item.icon size={19} />
          </button>
        ))}
      </div>
    </nav>
  );
}

function FullscreenPlayer() {
  const track = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const setFullscreen = usePlayerStore((state) => state.setFullscreen);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-deep)] px-5 pb-8 pt-3 text-white"
      style={{ backgroundImage: `radial-gradient(circle at 50% 12%, ${track.accent}40, transparent 24rem), linear-gradient(180deg, #111116, #020203 70%)` }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <header className="flex items-center justify-between py-3">
          <button onClick={() => setFullscreen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Закрыть">
            <ChevronDown size={22} />
          </button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">играет из</p>
            <p className="text-sm">{track.providerLabel}</p>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Еще">
            <MoreHorizontal size={22} />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
          <Cover track={track} size="xl" />
          <div className="w-full text-center">
            <h2 className="text-3xl font-semibold tracking-tight">{track.title}</h2>
            <p className="mt-2 text-zinc-400">{track.artist}</p>
          </div>

          <div className="w-full">
            <Waveform track={track} />
            <input className="mt-5 h-2 w-full accent-orange-400" type="range" min={0} max={duration || track.duration || 0} value={progress} onChange={(event) => usePlayerStore.getState().seekTo(Number(event.target.value))} aria-label="Позиция" />
            <div className="mt-2 flex justify-between font-mono text-xs text-zinc-500">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration || track.duration)}</span>
            </div>
          </div>

          <div className="flex w-full items-center justify-between px-2">
            <button onClick={() => usePlayerStore.getState().toggleLike(track)} className="grid h-12 w-12 place-items-center rounded-full bg-white/8" aria-label="Лайк">
              <Heart size={20} />
            </button>
            <button onClick={previous} className="grid h-14 w-14 place-items-center rounded-full bg-white/10" aria-label="Назад">
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button onClick={togglePlay} className="grid h-20 w-20 place-items-center rounded-full text-zinc-950 shadow-[0_0_48px_rgba(255,85,0,0.32)]" style={{ background: `linear-gradient(135deg, ${track.accent}, ${track.accent2})` }} aria-label={isPlaying ? "Пауза" : "Играть"}>
              {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={next} className="grid h-14 w-14 place-items-center rounded-full bg-white/10" aria-label="Вперед">
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white/8" aria-label="Сообщение">
              <MessageCircle size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
