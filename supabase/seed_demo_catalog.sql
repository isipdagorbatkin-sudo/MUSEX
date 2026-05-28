-- Optional demo catalog seed for local product testing.
-- Run after supabase/schema.sql.

insert into public.tracks (id, title, artist_name, album_title, artwork_url, duration_seconds, popularity_score, tags, metadata)
values
  ('00000000-0000-4000-8000-000000000001', 'Midnight Signal', 'Noir Relay', 'Afterimage Club', null, 348, 78, array['wave', 'night drive', 'friends'], '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000002', 'Glass Frequency', 'Sable Choir', 'Private Index', null, 282, 72, array['edit', 'cinematic', 'late'], '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000003', 'North Cache', 'Kito Lumen', 'Relay Tapes', null, 416, 84, array['self-hosted', 'rare', 'lossless'], '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000004', 'Static Bloom', 'Mira Vox', 'Room Tone', null, 321, 69, array['local', 'dream pop', 'sync'], '{"demo": true}')
on conflict (id) do update
set title = excluded.title,
    artist_name = excluded.artist_name,
    album_title = excluded.album_title,
    duration_seconds = excluded.duration_seconds,
    popularity_score = excluded.popularity_score,
    tags = excluded.tags,
    metadata = excluded.metadata,
    updated_at = now();

insert into public.track_sources (track_id, provider_id, provider_track_id, source_url, stream_url, quality, metadata)
values
  ('00000000-0000-4000-8000-000000000001', 'soundcloud_authorized', 'demo-midnight-signal', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'medium', '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000002', 'youtube_authorized', 'demo-glass-frequency', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'medium', '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000003', 'self_hosted', 'demo-north-cache', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'medium', '{"demo": true}'),
  ('00000000-0000-4000-8000-000000000004', 'local_demo', 'demo-static-bloom', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', 'medium', '{"demo": true}')
on conflict (provider_id, provider_track_id) do update
set stream_url = excluded.stream_url,
    quality = excluded.quality,
    metadata = excluded.metadata,
    updated_at = now();

