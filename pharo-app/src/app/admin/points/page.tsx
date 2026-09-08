import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PointsClient from './PointsClient';
import { SCORING_RULES, EVENT_TYPE_LABELS, POSITION_LABELS } from '@/config/scoring';

export const dynamic = 'force-dynamic';

export default async function AdminPointsPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const [players, managerPoints, gameweeks, fantasyTeams] = await Promise.all([
    prisma.player.findMany({
      include: {
        team: true,
        gameweekPoints: { include: { gameweek: true } },
      },
    }),
    prisma.managerGameweekPoint.findMany({
      include: {
        fantasyTeam: { include: { user: true } },
        gameweek: true,
      },
    }),
    prisma.gameweek.findMany({ orderBy: { number: 'asc' } }),
    prisma.fantasyTeam.findMany({ include: { user: true } }),
  ]);

  const playersData = players.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    team: p.team.name,
    gameweekPoints: p.gameweekPoints.map((gp) => ({
      gameweek: gp.gameweek.number,
      points: gp.points,
    })),
    totalPoints: p.gameweekPoints.reduce((s, gp) => s + gp.points, 0),
  }));

  const leaderboard = fantasyTeams.map((team) => {
    const total = managerPoints
      .filter((mp) => mp.fantasyTeamId === team.id)
      .reduce((s, mp) => s + mp.points, 0);
    return {
      teamId: team.id,
      name: team.user.name,
      total,
      gameweeks: gameweeks.map((gw) => {
        const mgp = managerPoints.find(
          (mp) => mp.fantasyTeamId === team.id && mp.gameweekId === gw.id
        );
        return { gameweek: gw.number, points: mgp?.points ?? 0 };
      }),
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <PointsClient
      players={playersData}
      leaderboard={leaderboard}
      scoringRules={SCORING_RULES}
      eventTypeLabels={EVENT_TYPE_LABELS}
      positionLabels={POSITION_LABELS}
    />
  );
}