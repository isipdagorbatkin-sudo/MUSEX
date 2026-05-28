import { NextResponse } from "next/server";
import { normalizeTrack } from "@/shared/lib/music-normalize";

type ItunesResult = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  primaryGenreName?: string;
};

type DeezerResult = {
  id: number;
  title?: string;
  artist?: { name?: string; picture_medium?: string };
  album?: { title?: string; cover_medium?: string; cover_big?: string };
  preview?: string;
  duration?: number;
  link?: string;
};

function highResItunesArtwork(url?: string) {
  return url?.replace("100x100bb", "600x600bb");
}

async function searchItunes(query: string) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "18");

  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return [];

  const data = (await response.json()) as { results?: ItunesResult[] };

  return (data.results ?? [])
    .filter((item) => item.previewUrl && item.trackName && item.artistName)
    .map((item) =>
      normalizeTrack({
        id: item.trackId ?? `${item.trackName}-${item.artistName}`,
        title: item.trackName ?? "Unknown track",
        artist: item.artistName ?? "Unknown artist",
        album: item.collectionName,
        duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
        sourceUrl: item.previewUrl ?? "",
        provider: "itunes",
        providerLabel: "Apple Music Preview",
        artworkUrl: highResItunesArtwork(item.artworkUrl100),
        externalUrl: item.trackViewUrl,
        tags: [item.primaryGenreName ?? "music", "official preview"],
      }),
    );
}

async function searchDeezer(query: string) {
  const url = new URL("https://api.deezer.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "18");

  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return [];

  const data = (await response.json()) as { data?: DeezerResult[] };

  return (data.data ?? [])
    .filter((item) => item.preview && item.title && item.artist?.name)
    .map((item) =>
      normalizeTrack({
        id: item.id,
        title: item.title ?? "Unknown track",
        artist: item.artist?.name ?? "Unknown artist",
        album: item.album?.title,
        duration: item.duration || 30,
        sourceUrl: item.preview ?? "",
        provider: "deezer",
        providerLabel: "Deezer Preview",
        artworkUrl: item.album?.cover_big ?? item.album?.cover_medium ?? item.artist?.picture_medium,
        externalUrl: item.link,
        tags: ["deezer", "official preview"],
      }),
    );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  const settled = await Promise.allSettled([searchItunes(query), searchDeezer(query)]);
  const tracks = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const unique = new Map<string, (typeof tracks)[number]>();

  for (const track of tracks) {
    const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, track);
  }

  return NextResponse.json({
    query,
    tracks: [...unique.values()].slice(0, 28),
  });
}

