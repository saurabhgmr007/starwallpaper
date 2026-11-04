import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const PASSCODE = process.env.NOTES_PASSCODE;

export const dynamic = 'force-dynamic';

const DEFAULT_LAYOUT = {
  'top-left': [],
  'top-right': ['payout', 'clock', 'weather'],
  'bottom-left': ['spotify'],
  'bottom-right': [],
};

export async function GET() {
  try {
    const activeBackground = (await redis.get('activeBackground')) || 'Untitledblend';
    const customImageUrl = (await redis.get('customImageUrl')) || '';
    const widgetLayout = (await redis.get('widgetLayout')) || DEFAULT_LAYOUT;
    return NextResponse.json({ activeBackground, customImageUrl, widgetLayout });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { activeBackground, customImageUrl, widgetLayout, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (activeBackground) {
      await redis.set('activeBackground', activeBackground);
    }
    if (customImageUrl !== undefined) {
      await redis.set('customImageUrl', customImageUrl);
    }
    if (widgetLayout !== undefined) {
      await redis.set('widgetLayout', widgetLayout);
    }
    return NextResponse.json({ activeBackground, customImageUrl, widgetLayout });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
