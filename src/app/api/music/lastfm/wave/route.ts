import { NextResponse } from "next/server";

type LastFmTrack = {
  name?: string;
  artist?: { name?: string } | string;
};

function artistName(track: LastFmTrack) {
  return typeof track.artist === "string" ? track.artist : track.artist?.name;
}

async function callLastFm(params: Record<string, string>) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.searchParams.set("format", "json");
  url.searchParams.set("api_key", apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) return null;
  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist")?.trim();
  const track = searchParams.get("track")?.trim();
  const tags = searchParams.get("tags")?.trim();

  const seeds: string[] = [];

  if (artist && track) {
    const similar = (await callLastFm({
      method: "track.getsimilar",
      artist,
      track,
      limit: "12",
    })) as { similartracks?: { track?: LastFmTrack[] } } | null;

    for (const item of similar?.similartracks?.track ?? []) {
      if (item.name && artistName(item)) seeds.push(`${artistName(item)} ${item.name}`);
    }
  }

  if (artist) {
    const top = (await callLastFm({
      method: "artist.gettoptracks",
      artist,
      limit: "8",
    })) as { toptracks?: { track?: LastFmTrack[] } } | null;

    for (const item of top?.toptracks?.track ?? []) {
      if (item.name && artistName(item)) seeds.push(`${artistName(item)} ${item.name}`);
    }
  }

  if (tags) {
    for (const tag of tags.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3)) {
      const tagged = (await callLastFm({
        method: "tag.gettoptracks",
        tag,
        limit: "6",
      })) as { tracks?: { track?: LastFmTrack[] } } | null;

      for (const item of tagged?.tracks?.track ?? []) {
        if (item.name && artistName(item)) seeds.push(`${artistName(item)} ${item.name}`);
      }
    }
  }

  return NextResponse.json({
    configured: Boolean(process.env.LASTFM_API_KEY),
    seeds: [...new Set(seeds)].slice(0, 24),
  });
}
