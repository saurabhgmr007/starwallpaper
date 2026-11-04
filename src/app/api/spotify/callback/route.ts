import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.json({ error: error || 'No authorization code received' }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = `${url.origin}/api/spotify/callback`;

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.refresh_token) {
      await redis.set('spotifyRefreshToken', tokenData.refresh_token);
      // Redirect back to dashboard with success
      return NextResponse.redirect(new URL('/notes?spotify=connected', req.url));
    }

    return NextResponse.json(
      { error: 'Failed to obtain refresh token', details: tokenData },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }
}
