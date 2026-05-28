"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "./player-store";

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const readyTrackIdRef = useRef(currentTrack.id);
  const playedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (readyTrackIdRef.current !== currentTrack.id) {
      audio.src = currentTrack.sourceUrl || "";
      audio.load();
      playedRef.current[currentTrack.id] = false;
      readyTrackIdRef.current = currentTrack.id;
    }

    if ("mediaSession" in navigator && currentTrack.sourceUrl) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: currentTrack.artworkUrl ? [{ src: currentTrack.artworkUrl, sizes: "512x512", type: "image/jpeg" }] : undefined,
      });
      navigator.mediaSession.setActionHandler("play", () => void audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("nexttrack", next);
      navigator.mediaSession.setActionHandler("previoustrack", previous);
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") audio.currentTime = details.seekTime;
      });
    }
  }, [currentTrack, next, previous]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && currentTrack.sourceUrl) {
      audio.play().catch(() => usePlayerStore.setState({ isPlaying: false }));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack.id, currentTrack.sourceUrl]);

  return (
    <audio
      ref={audioRef}
      preload="auto"
      playsInline
      src={currentTrack.sourceUrl || undefined}
      onEnded={next}
      onError={() => usePlayerStore.setState({ isPlaying: false })}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;
        usePlayerStore.getState().setProgress(audio.currentTime || 0, audio.duration || currentTrack.duration);
        if (currentTrack.sourceUrl && !playedRef.current[currentTrack.id] && audio.currentTime > 12) {
          playedRef.current[currentTrack.id] = true;
          usePlayerStore.getState().recordPlay(currentTrack);
        }
      }}
      onDurationChange={(event) => {
        const audio = event.currentTarget;
        usePlayerStore.getState().setProgress(audio.currentTime || 0, audio.duration || currentTrack.duration);
      }}
      onPlay={() => usePlayerStore.setState({ isPlaying: true })}
      onPause={() => usePlayerStore.setState({ isPlaying: false })}
    />
  );
}
