"use client";

import { useEffect, useRef } from "react";
import type { EqPreset } from "./types";
import { usePlayerStore } from "./player-store";

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const eqGains: Record<EqPreset, [number, number, number]> = {
  flat: [0, 0, 0],
  rock: [5, -1, 4],
  pop: [2, 3, 2],
  classic: [0, 2, 5],
  bass: [7, 1, -1],
  vocal: [-1, 5, 2],
};

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const playedRef = useRef<Record<string, boolean>>({});

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);
  const eqPreset = usePlayerStore((state) => state.eqPreset);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const readyTrackIdRef = useRef(currentTrack.id);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (readyTrackIdRef.current !== currentTrack.id) {
      audio.src = currentTrack.sourceUrl;
      audio.load();
      playedRef.current[currentTrack.id] = false;
      readyTrackIdRef.current = currentTrack.id;
    }

    if ("mediaSession" in navigator) {
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
    const gains = eqGains[eqPreset];
    filtersRef.current.forEach((filter, index) => {
      filter.gain.value = gains[index] ?? 0;
    });
  }, [eqPreset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    async function play() {
      const media = audioRef.current;
      if (!media) return;
      if (!contextRef.current) {
        const audioWindow = window as AudioWindow;
        const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
        if (!AudioContextCtor) return;
        const context = new AudioContextCtor();
        const source = context.createMediaElementSource(media);
        const low = context.createBiquadFilter();
        const mid = context.createBiquadFilter();
        const high = context.createBiquadFilter();

        low.type = "lowshelf";
        low.frequency.value = 180;
        mid.type = "peaking";
        mid.frequency.value = 1200;
        mid.Q.value = 0.8;
        high.type = "highshelf";
        high.frequency.value = 4200;

        source.connect(low).connect(mid).connect(high).connect(context.destination);
        contextRef.current = context;
        sourceRef.current = source;
        filtersRef.current = [low, mid, high];
      }

      await contextRef.current?.resume();
      media.play().catch(() => usePlayerStore.setState({ isPlaying: false }));
    }

    if (isPlaying) {
      void play();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack.id]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      src={currentTrack.sourceUrl}
      onEnded={next}
      onTimeUpdate={(event) => {
        const audio = event.currentTarget;
        usePlayerStore.getState().setProgress(audio.currentTime || 0, audio.duration || currentTrack.duration);
        if (!playedRef.current[currentTrack.id] && audio.currentTime > 12) {
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
