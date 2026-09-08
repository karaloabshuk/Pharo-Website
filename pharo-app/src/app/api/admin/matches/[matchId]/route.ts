import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
        gameweek: true,
        events: {
          include: { player: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Fetch match error:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await prisma.match.findUnique({ where: { id: matchId } });
    if (!existing) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.homeTeamId) data.homeTeamId = body.homeTeamId;
    if (body.awayTeamId) data.awayTeamId = body.awayTeamId;
    if (body.date) data.date = new Date(body.date);
    if (body.gameweekId) data.gameweekId = body.gameweekId;
    if (body.status) data.status = body.status;
    if (body.homeScore !== undefined) data.homeScore = body.homeScore;
    if (body.awayScore !== undefined) data.awayScore = body.awayScore;

    const match = await prisma.match.update({
      where: { id: matchId },
      data,
      include: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
      },
    });

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
      include: { events: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.matchEvent.deleteMany({ where: { matchId } }),
      prisma.match.delete({ where: { id: matchId } }),
    ]);

    if (existing.gameweekId) {
      await recalculateGameweek(existing.gameweekId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete match error:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}

import { recalculatePlayerAndManagerPoints } from '@/lib/recalculate';

async function recalculateGameweek(gameweekId: string) {
  await recalculatePlayerAndManagerPoints(gameweekId);
}