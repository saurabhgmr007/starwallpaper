import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

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

    // Spotify may issue a new refresh token
    if (data.refresh_token) {
      await redis.set('spotifyRefreshToken', data.refresh_token);
    }

    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ isPlaying: false, needsAuth: true });
    }

    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 204 = no active playback
    if (res.status === 204) {
      return NextResponse.json({ isPlaying: false });
    }

    if (!res.ok) {
      return NextResponse.json({ isPlaying: false, error: res.status });
    }

    const data = await res.json();

    if (!data || !data.item) {
      return NextResponse.json({ isPlaying: false });
    }

    return NextResponse.json({
      isPlaying: data.is_playing,
      title: data.item.name,
      artist: data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
      album: data.item.album?.name || '',
      albumArt: data.item.album?.images?.[1]?.url || data.item.album?.images?.[0]?.url || '',
      progress: data.progress_ms || 0,
      duration: data.item.duration_ms || 0,
    });
  } catch {
    return NextResponse.json({ isPlaying: false });
  }
}
