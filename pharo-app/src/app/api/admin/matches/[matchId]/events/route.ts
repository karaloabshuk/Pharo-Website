import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { addMatchEvent } from '@/lib/scoring';
import { EVENT_TYPES, type EventType } from '@/config/scoring';

function requireAdmin(session: { role?: string } | null) {
  if (!session || session.role !== 'ADMIN') return false;
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      include: { player: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { playerId, eventType, bonusValue } = body;

    if (!playerId || !eventType) {
      return NextResponse.json(
        { error: 'playerId and eventType are required' },
        { status: 400 }
      );
    }

    if (!EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    if (eventType === 'BONUS') {
      const bv = Number(bonusValue);
      if (![1, 2, 3].includes(bv)) {
        return NextResponse.json(
          { error: 'Bonus must be +1, +2, or +3' },
          { status: 400 }
        );
      }
    }

    const event = await addMatchEvent(
      matchId,
      playerId,
      eventType as EventType,
      eventType === 'BONUS' ? Number(bonusValue) : undefined
    );

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}