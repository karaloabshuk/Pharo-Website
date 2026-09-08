import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PlayersClient from './PlayersClient';

export const dynamic = 'force-dynamic';

const POSITION_LABELS: Record<string, string> = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD',
};

export default async function AdminPlayersPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const [players, teams] = await Promise.all([
    prisma.player.findMany({
      include: {
        team: true,
        gameweekPoints: true,
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const playersData = players.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    price: player.price,
    team: player.team.name,
    teamId: player.team.id,
    events: player._count.events,
    totalPoints: player.gameweekPoints.reduce((sum, gp) => sum + gp.points, 0),
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Players</h1>
          <p className="admin-page-subtitle">View all players and their points</p>
        </div>
      </div>

      <PlayersClient players={playersData} teams={teams} />
    </div>
  );
}