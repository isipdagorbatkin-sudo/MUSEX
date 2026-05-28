import { NextResponse } from "next/server";
import type { Track } from "@/features/player/types";

const blocks = [
  {
    id: "for-you",
    title: "Рекомендовано тебе",
    queries: ["Miyagi", "Дора", "Kizaru", "Скриптонит"],
  },
  {
    id: "cis-now",
    title: "Сейчас слушают в СНГ",
    queries: ["MACAN", "INSTASAMKA", "три дня дождя", "Кишлак"],
  },
  {
    id: "edits",
    title: "Ремиксы и эдиты",
    queries: ["slowed remix", "phonk", "sped up", "nightcore"],
  },
];

async function search(origin: string, query: string) {
  const response = await fetch(`${origin}/api/music/search?q=${encodeURIComponent(query)}`, {
    next: { revalidate: 90 },
  });

  if (!response.ok) return [];
  const data = (await response.json()) as { tracks: Track[] };
  return data.tracks;
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const settled = await Promise.allSettled(
    blocks.map(async (block) => {
      const groups = await Promise.all(block.queries.map((query) => search(origin, query)));
      const unique = new Map<string, Track>();

      for (const track of groups.flat()) {
        const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
        if (!unique.has(key)) unique.set(key, track);
      }

      return {
        id: block.id,
        title: block.title,
        tracks: [...unique.values()].slice(0, 12),
      };
    }),
  );

  return NextResponse.json({
    blocks: settled
      .filter((item) => item.status === "fulfilled")
      .map((item) => (item as PromiseFulfilledResult<{ id: string; title: string; tracks: Track[] }>).value)
      .filter((block) => block.tracks.length > 0),
  });
}

