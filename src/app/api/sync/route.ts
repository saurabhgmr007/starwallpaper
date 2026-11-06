import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

const DEFAULT_LASTFM_USER = 'StarSumit';
const DEFAULT_LASTFM_KEY = '5f2ec87b86287cfff46f0ce5484560e8';

const DEFAULT_LAYOUT = {
  'top-left': [],
  'top-right': ['payout', 'clock', 'weather'],
  'bottom-left': ['spotify'],
  'bottom-right': [],
};

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

export async function GET() {
  try {
    // Fetch all Redis data + Last.fm in ONE single parallel round-trip
    const [notes, activeBackground, customImageUrl, widgetLayout, payouts, payoutGoal, spotify] =
      await Promise.all([
        redis.lrange('notes', 0, -1).catch(() => []),
        redis.get('activeBackground').catch(() => 'Untitledblend'),
        redis.get('customImageUrl').catch(() => ''),
        redis.get('widgetLayout').catch(() => DEFAULT_LAYOUT),
        redis.lrange('payouts', 0, -1).catch(() => []),
        redis.get('payoutGoal').catch(() => 1000),
        getFromLastFm(),
      ]);

    return NextResponse.json({
      notes: notes || [],
      settings: {
        activeBackground: activeBackground || 'Untitledblend',
        customImageUrl: customImageUrl || '',
        widgetLayout: widgetLayout || DEFAULT_LAYOUT,
      },
      payouts: {
        records: payouts || [],
        goal: Number(payoutGoal) || 1000,
      },
      spotify: spotify || { isPlaying: false },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
