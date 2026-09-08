import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      include: {
        user: true,
        gameweekPoints: {
          orderBy: { gameweek: { number: 'asc' } },
          include: { gameweek: true },
        },
      },
    });

    const currentGameweek = await prisma.gameweek.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { number: 'desc' },
    });

    const rows = fantasyTeams.map((team) => {
      let currentGWPoints = 0;
      let totalPoints = 0;

      if (currentGameweek) {
        const gw = team.gameweekPoints.find(
          (p) => p.gameweekId === currentGameweek.id
        );
        currentGWPoints = gw?.points ?? 0;
      }

      totalPoints = team.gameweekPoints.reduce((sum, p) => sum + p.points, 0);

      return {
        id: team.id,
        managerName: team.user.name,
        teamName: team.name,
        currentGW: currentGameweek ? currentGWPoints : 0,
        total: totalPoints,
      };
    });

    rows.sort((a, b) => b.total - a.total);

    const ranked = rows.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

    return NextResponse.json({
      leaderboard: ranked,
      currentGameweek: currentGameweek
        ? { id: currentGameweek.id, number: currentGameweek.number, name: currentGameweek.name }
        : null,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}