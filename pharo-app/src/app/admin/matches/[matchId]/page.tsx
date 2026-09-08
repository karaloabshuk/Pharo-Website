import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import MatchCenter from './MatchCenter';
import { EVENT_TYPE_LABELS, type EventType } from '@/config/scoring';

export const dynamic = 'force-dynamic';

export default async function AdminMatchCenterPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

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
    notFound();
  }

  const playersByTeam =
    match.status !== 'FINISHED'
      ? [
          { team: match.homeTeam.name, players: match.homeTeam.players },
          { team: match.awayTeam.name, players: match.awayTeam.players },
        ]
      : [];

  return (
    <div className="admin-page">
      <div className="admin-match-center-header">
        <h1 className="admin-page-title">Match Center</h1>
        <div className="admin-match-score-header">
          <span className="admin-match-team-name">{match.homeTeam.name}</span>
          <span className="admin-match-score-big">
            {match.homeScore} - {match.awayScore}
          </span>
          <span className="admin-match-team-name">{match.awayTeam.name}</span>
        </div>
        <p className="admin-page-subtitle">
          {match.gameweek.name} ·{' '}
          {EVENT_TYPE_LABELS && `${match.events.length} events`}
        </p>
      </div>

      <MatchCenter match={match} />
    </div>
  );
}