-- MUSECS initial Supabase schema.
-- Run this in Supabase Dashboard -> SQL Editor for project kancjkotwznjthedexxi.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  display_name text,
  avatar_url text,
  bio text,
  favorite_artists text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  bio text,
  external_ids jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text not null,
  album_title text,
  artwork_url text,
  duration_seconds integer,
  popularity_score numeric not null default 0,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracks_title_artist_idx on public.tracks using gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(artist_name, '') || ' ' || coalesce(album_title, ''))
);
create index if not exists tracks_tags_idx on public.tracks using gin (tags);
create index if not exists tracks_popularity_idx on public.tracks (popularity_score desc);

create table if not exists public.provider_registry (
  id text primary key,
  label text not null,
  kind text not null check (kind in ('official_api', 'public_feed', 'self_hosted', 'local', 'community')),
  is_enabled boolean not null default true,
  priority integer not null default 100,
  region_codes text[] not null default '{}',
  capabilities jsonb not null default '{}',
  health jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.track_sources (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  provider_id text not null references public.provider_registry(id) on delete restrict,
  provider_track_id text not null,
  source_url text,
  stream_url text,
  artwork_url text,
  quality text,
  region_codes text[] not null default '{}',
  is_playable boolean not null default true,
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, provider_track_id)
);

create index if not exists track_sources_track_idx on public.track_sources (track_id);
create index if not exists track_sources_provider_idx on public.track_sources (provider_id, is_playable);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.listening_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  source_id uuid references public.track_sources(id) on delete set null,
  played_ms integer not null default 0,
  completed boolean not null default false,
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  query text not null,
  provider_ids text[] not null default '{}',
  result_count integer not null default 0,
  clicked_track_id uuid references public.tracks(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  reason text not null,
  score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_session_members (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'listener' check (role in ('host', 'listener')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.live_playback_state (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete set null,
  source_id uuid references public.track_sources(id) on delete set null,
  is_playing boolean not null default false,
  position_ms integer not null default 0,
  host_clock_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null default 'one_second',
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  starts_at timestamptz,
  answer_revealed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.game_scores (
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  guess text,
  is_correct boolean not null default false,
  reaction_ms integer,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
drop trigger if exists artists_updated_at on public.artists;
drop trigger if exists tracks_updated_at on public.tracks;
drop trigger if exists provider_registry_updated_at on public.provider_registry;
drop trigger if exists track_sources_updated_at on public.track_sources;
drop trigger if exists playlists_updated_at on public.playlists;
drop trigger if exists live_sessions_updated_at on public.live_sessions;
drop trigger if exists game_rooms_updated_at on public.game_rooms;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger artists_updated_at before update on public.artists for each row execute function public.set_updated_at();
create trigger tracks_updated_at before update on public.tracks for each row execute function public.set_updated_at();
create trigger provider_registry_updated_at before update on public.provider_registry for each row execute function public.set_updated_at();
create trigger track_sources_updated_at before update on public.track_sources for each row execute function public.set_updated_at();
create trigger playlists_updated_at before update on public.playlists for each row execute function public.set_updated_at();
create trigger live_sessions_updated_at before update on public.live_sessions for each row execute function public.set_updated_at();
create trigger game_rooms_updated_at before update on public.game_rooms for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.provider_registry (id, label, kind, priority, capabilities)
values
  ('soundcloud_authorized', 'SoundCloud authorized provider', 'official_api', 20, '{"search": true, "stream": true, "artwork": true}'),
  ('youtube_authorized', 'YouTube authorized provider', 'official_api', 30, '{"search": true, "stream": false, "artwork": true}'),
  ('self_hosted', 'Self-hosted media index', 'self_hosted', 10, '{"search": true, "stream": true, "artwork": true}'),
  ('local_demo', 'Local demo catalog', 'local', 100, '{"search": true, "stream": true, "artwork": false}')
on conflict (id) do update
set label = excluded.label,
    kind = excluded.kind,
    priority = excluded.priority,
    capabilities = excluded.capabilities,
    updated_at = now();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.artists enable row level security;
alter table public.tracks enable row level security;
alter table public.provider_registry enable row level security;
alter table public.track_sources enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.likes enable row level security;
alter table public.listening_history enable row level security;
alter table public.search_events enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_session_members enable row level security;
alter table public.live_playback_state enable row level security;
alter table public.game_rooms enable row level security;
alter table public.game_rounds enable row level security;
alter table public.game_scores enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are visible to signed in users" on public.profiles for select to authenticated using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "follows visible to signed in users" on public.follows for select to authenticated using (true);
create policy "users follow as themselves" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "users remove own follows" on public.follows for delete to authenticated using (auth.uid() = follower_id);

create policy "catalog visible to signed in users" on public.artists for select to authenticated using (true);
create policy "tracks visible to signed in users" on public.tracks for select to authenticated using (true);
create policy "providers visible to signed in users" on public.provider_registry for select to authenticated using (is_enabled = true);
create policy "sources visible to signed in users" on public.track_sources for select to authenticated using (is_playable = true);

create policy "playlist visibility" on public.playlists for select to authenticated using (
  visibility = 'public'
  or owner_id = auth.uid()
  or exists (
    select 1 from public.follows
    where follower_id = auth.uid()
      and following_id = playlists.owner_id
      and playlists.visibility = 'friends'
  )
);
create policy "users create own playlists" on public.playlists for insert to authenticated with check (auth.uid() = owner_id);
create policy "users update own playlists" on public.playlists for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "users delete own playlists" on public.playlists for delete to authenticated using (auth.uid() = owner_id);

create policy "playlist tracks visible with playlist" on public.playlist_tracks for select to authenticated using (
  exists (
    select 1 from public.playlists
    where playlists.id = playlist_tracks.playlist_id
      and (
        playlists.visibility = 'public'
        or playlists.owner_id = auth.uid()
        or exists (
          select 1 from public.follows
          where follower_id = auth.uid()
            and following_id = playlists.owner_id
            and playlists.visibility = 'friends'
        )
      )
  )
);
create policy "playlist owners edit tracks" on public.playlist_tracks for all to authenticated using (
  exists (select 1 from public.playlists where playlists.id = playlist_tracks.playlist_id and playlists.owner_id = auth.uid())
) with check (
  exists (select 1 from public.playlists where playlists.id = playlist_tracks.playlist_id and playlists.owner_id = auth.uid())
);

create policy "likes visible to signed in users" on public.likes for select to authenticated using (true);
create policy "users manage own likes" on public.likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own listening history" on public.listening_history for select to authenticated using (auth.uid() = user_id);
create policy "users write own listening history" on public.listening_history for insert to authenticated with check (auth.uid() = user_id);

create policy "users write own search telemetry" on public.search_events for insert to authenticated with check (auth.uid() = user_id or user_id is null);
create policy "users read own recommendation events" on public.recommendation_events for select to authenticated using (auth.uid() = user_id);
create policy "users write own recommendation events" on public.recommendation_events for insert to authenticated with check (auth.uid() = user_id);

create policy "live sessions visible to members" on public.live_sessions for select to authenticated using (
  host_id = auth.uid()
  or exists (select 1 from public.live_session_members where session_id = live_sessions.id and user_id = auth.uid())
);
create policy "users create hosted sessions" on public.live_sessions for insert to authenticated with check (auth.uid() = host_id);
create policy "hosts update sessions" on public.live_sessions for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "session members visible to members" on public.live_session_members for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.live_session_members members where members.session_id = live_session_members.session_id and members.user_id = auth.uid())
);
create policy "users join as themselves" on public.live_session_members for insert to authenticated with check (auth.uid() = user_id);
create policy "users leave sessions" on public.live_session_members for delete to authenticated using (auth.uid() = user_id);

create policy "playback visible to members" on public.live_playback_state for select to authenticated using (
  exists (select 1 from public.live_session_members where session_id = live_playback_state.session_id and user_id = auth.uid())
);
create policy "hosts update playback" on public.live_playback_state for all to authenticated using (
  exists (select 1 from public.live_sessions where id = live_playback_state.session_id and host_id = auth.uid())
) with check (
  exists (select 1 from public.live_sessions where id = live_playback_state.session_id and host_id = auth.uid())
);

create policy "game rooms visible to signed in users" on public.game_rooms for select to authenticated using (true);
create policy "users create game rooms" on public.game_rooms for insert to authenticated with check (auth.uid() = host_id);
create policy "hosts update game rooms" on public.game_rooms for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);
create policy "game rounds visible to signed in users" on public.game_rounds for select to authenticated using (true);
create policy "game scores visible to signed in users" on public.game_scores for select to authenticated using (true);
create policy "users write own game scores" on public.game_scores for insert to authenticated with check (auth.uid() = user_id);

create policy "users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "avatar images are public" on storage.objects for select using (bucket_id = 'avatars');
create policy "users upload own avatar files" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "users update own avatar files" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
