import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function requireAdmin(session: { role?: string } | null) {
  if (!session || session.role !== 'ADMIN') {
    return false;
  }
  return true;
}

export async function GET() {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
        events: { include: { player: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Fetch matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { homeTeamId, awayTeamId, date, gameweekId, status } = body;

    if (!homeTeamId || !awayTeamId || !date || !gameweekId) {
      return NextResponse.json(
        { error: 'homeTeamId, awayTeamId, date, and gameweekId are required' },
        { status: 400 }
      );
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: 'Home and away teams must be different' },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        gameweekId,
        status: status || 'UPCOMING',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}