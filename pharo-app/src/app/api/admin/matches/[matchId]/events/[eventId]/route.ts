import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteMatchEvent, updateMatchEvent } from '@/lib/scoring';
import { EVENT_TYPES, type EventType } from '@/config/scoring';

function requireAdmin(session: { role?: string } | null) {
  if (!session || session.role !== 'ADMIN') return false;
  return true;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string; eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data: { eventType?: EventType; playerId?: string; bonusValue?: number } = {};

    if (body.eventType) {
      if (!EVENT_TYPES.includes(body.eventType)) {
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
      }
      data.eventType = body.eventType;
    }
    if (body.playerId) data.playerId = body.playerId;
    if (body.bonusValue !== undefined) {
      const bv = Number(body.bonusValue);
      if (![1, 2, 3].includes(bv)) {
        return NextResponse.json(
          { error: 'Bonus must be +1, +2, or +3' },
          { status: 400 }
        );
      }
      data.bonusValue = bv;
    }

    const event = await updateMatchEvent(eventId, data);
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string; eventId: string }> }
) {
  const { eventId } = await params;
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const event = await deleteMatchEvent(eventId);
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Delete event error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}