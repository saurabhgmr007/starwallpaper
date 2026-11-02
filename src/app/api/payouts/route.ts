import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const PASSCODE = process.env.NOTES_PASSCODE;

export const dynamic = 'force-dynamic';

type Payout = {
  id: string;
  date: string;
  amount: number;
};

// GET — fetch all payouts + goal
export async function GET() {
  try {
    const payouts: Payout[] = (await redis.lrange('payouts', 0, -1)) || [];
    const payoutGoal = (await redis.get('payoutGoal')) || 1000;
    return NextResponse.json({ payouts, payoutGoal });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

// POST — add a new payout or update goal
export async function POST(req: Request) {
  try {
    const { date, amount, payoutGoal, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update goal if provided
    if (payoutGoal !== undefined) {
      await redis.set('payoutGoal', payoutGoal);
    }

    // Add payout entry if date and amount provided
    if (date && amount !== undefined) {
      const payout: Payout = {
        id: crypto.randomUUID(),
        date,
        amount: Number(amount),
      };
      await redis.lpush('payouts', payout);
    }

    const payouts: Payout[] = (await redis.lrange('payouts', 0, -1)) || [];
    const currentGoal = (await redis.get('payoutGoal')) || 1000;
    return NextResponse.json({ payouts, payoutGoal: currentGoal });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save payout' }, { status: 500 });
  }
}

// PUT — edit an existing payout entry
export async function PUT(req: Request) {
  try {
    const { id, date, amount, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payouts: Payout[] = (await redis.lrange('payouts', 0, -1)) || [];
    const index = payouts.findIndex((p) => p.id === id);

    if (index !== -1) {
      payouts[index] = { ...payouts[index], date, amount: Number(amount) };
      await redis.lset('payouts', index, payouts[index]);
      const payoutGoal = (await redis.get('payoutGoal')) || 1000;
      return NextResponse.json({ payouts, payoutGoal });
    }
    return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}

// DELETE — delete a specific payout
export async function DELETE(req: Request) {
  try {
    const { id, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payouts: Payout[] = (await redis.lrange('payouts', 0, -1)) || [];
    const newPayouts = payouts.filter((p) => p.id !== id);
    await redis.del('payouts');
    if (newPayouts.length > 0) {
      await redis.rpush('payouts', ...newPayouts);
    }
    const payoutGoal = (await redis.get('payoutGoal')) || 1000;
    return NextResponse.json({ payouts: newPayouts, payoutGoal });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payout' }, { status: 500 });
  }
}
