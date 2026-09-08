import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { SCORING_RULES, EVENT_TYPE_LABELS, type EventType } from '@/config/scoring';

function requireAdmin(session: { role?: string } | null) {
  return session?.role === 'ADMIN';
}

export async function GET() {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [players, matches, gameweeks, playerPoints, managerPoints] = await Promise.all([
      prisma.player.findMany({
        include: {
          team: true,
          gameweekPoints: true,
        },
      }),
      prisma.match.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
          gameweek: true,
        },
      }),
      prisma.gameweek.findMany({
        orderBy: { number: 'asc' },
      }),
      prisma.playerGameweekPoint.findMany({
        include: {
          player: { include: { team: true } },
          gameweek: true,
        },
      }),
      prisma.managerGameweekPoint.findMany({
        include: {
          fantasyTeam: { include: { user: true } },
          gameweek: true,
        },
      }),
    ]);

    return NextResponse.json({
      players,
      matches,
      gameweeks,
      playerPoints,
      managerPoints,
      scoringRules: SCORING_RULES,
      eventTypeLabels: EVENT_TYPE_LABELS,
    });
  } catch (error) {
    console.error('Points overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}