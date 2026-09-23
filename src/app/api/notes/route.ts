import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const PASSCODE = process.env.NOTES_PASSCODE;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notes = await redis.lrange('notes', 0, -1);
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!text || typeof text !== 'string') return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const note = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      selected: false
    };

    await redis.lpush('notes', note);
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, selected, passcode } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notes: any[] = await redis.lrange('notes', 0, -1);
    const index = notes.findIndex((n: any) => n.id === id);
    
    if (index !== -1) {
      notes[index].selected = selected;
      await redis.lset('notes', index, notes[index]);
      return NextResponse.json(notes[index]);
    }
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { passcode, id } = await req.json();
    if (!PASSCODE || passcode !== PASSCODE) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (id) {
      // Delete specific note
      const notes: any[] = await redis.lrange('notes', 0, -1);
      const newNotes = notes.filter((n: any) => n.id !== id);
      await redis.del('notes');
      if (newNotes.length > 0) {
        // RPUSH pushes to the end, keeping the original order since we sliced from top-down
        // Actually LRange returns from top to bottom. If we re-insert them, we should do it in reverse, or just use rpush
        await redis.rpush('notes', ...newNotes);
      }
      return NextResponse.json({ success: true });
    } else {
      await redis.del('notes');
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
