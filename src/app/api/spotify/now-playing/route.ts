import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

const DEFAULT_LASTFM_USER = 'StarSumit';
const DEFAULT_LASTFM_KEY = '5f2ec87b86287cfff46f0ce5484560e8';

async function getFromLastFm(): Promise<any | null> {
  try {
    const lastFmUser = (await redis.get('lastFmUser')) || DEFAULT_LASTFM_USER;
    const lastFmKey = process.env.LASTFM_API_KEY || DEFAULT_LASTFM_KEY;

    if (!lastFmUser || !lastFmKey) return null;

    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(
        String(lastFmUser)
      )}&api_key=${lastFmKey}&format=json&limit=1`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const rawTrack = data?.recenttracks?.track;
    if (!rawTrack) return null;

    const track = Array.isArray(rawTrack) ? rawTrack[0] : rawTrack;
    if (!track) return null;

    const isNowPlaying = track['@attr']?.nowplaying === 'true';

    // Extract best image
    const images = track.image || [];
    const albumArt =
      images.find((img: any) => img.size === 'extralarge')?.['#text'] ||
      images.find((img: any) => img.size === 'large')?.['#text'] ||
      images[0]?.['#text'] ||
      '';

    return {
      isPlaying: isNowPlaying,
      title: track.name || '',
      artist: track.artist?.['#text'] || track.artist?.name || 'Unknown',
      album: track.album?.['#text'] || '',
      albumArt: albumArt,
      source: 'lastfm',
    };
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const refreshToken = await redis.get('spotifyRefreshToken');
  if (!refreshToken) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken as string,
      }),
    });

    const data = await res.json();
    if (data.refresh_token) {
      await redis.set('spotifyRefreshToken', data.refresh_token);
    }

    return data.access_token || null;
  } catch {
    return null;
  }
}

async function getFromSpotify(): Promise<any | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204 || !res.ok) return null;

    const data = await res.json();
    if (!data || !data.item) return null;

    return {
      isPlaying: data.is_playing,
      title: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      album: data.item.album?.name || '',
      albumArt: data.item.album?.images?.[1]?.url || data.item.album?.images?.[0]?.url || '',
      progress: data.progress_ms || 0,
      duration: data.item.duration_ms || 0,
      source: 'spotify',
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // 1. Try Last.fm first (works with Free Spotify accounts & updates in real-time)
    const lastFmData = await getFromLastFm();
    if (lastFmData && lastFmData.title) {
      return NextResponse.json(lastFmData);
    }

    // 2. Try Spotify Web API if Premium is active
    const spotifyData = await getFromSpotify();
    if (spotifyData && spotifyData.title) {
      return NextResponse.json(spotifyData);
    }

    return NextResponse.json({ isPlaying: false });
  } catch {
    return NextResponse.json({ isPlaying: false });
  }
}
