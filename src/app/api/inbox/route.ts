import { NextResponse } from 'next/server';
import { loadInbox } from '@/server/inboxStore';

export async function GET() {
  try {
    const snapshot = await loadInbox();
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error('GET /api/inbox failed', e);
    return NextResponse.json({ error: 'Could not load the inbox.' }, { status: 500 });
  }
}
