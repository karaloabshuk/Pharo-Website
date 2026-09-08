import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MatchActions from './MatchActions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  FINISHED: 'Finished',
};

export default async function AdminMatchesPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const [matches, teams, gameweeks] = await Promise.all([
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
        _count: { select: { events: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    prisma.gameweek.findMany({ orderBy: { number: 'asc' } }),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Matches</h1>
          <p className="admin-page-subtitle">Manage fixtures and match status</p>
        </div>
        <MatchActions teams={teams} gameweeks={gameweeks} />
      </div>

      {matches.length === 0 ? (
        <div className="admin-card">
          <p className="admin-empty">No matches yet. Create your first match.</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-match-list">
            {matches.map((match) => (
              <div key={match.id} className="admin-match-row">
                <div className="admin-match-teams">
                  <span className="admin-match-team">{match.homeTeam.name}</span>
                  <span className="admin-match-score">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="admin-match-team">{match.awayTeam.name}</span>
                </div>
                <div className="admin-match-meta">
                  <span className={`admin-status-badge status-${match.status.toLowerCase()}`}>
                    {STATUS_LABELS[match.status] || match.status}
                  </span>
                  <span className="admin-match-gw">{match.gameweek.name}</span>
                  <span className="admin-match-date">
                    {new Date(match.date).toLocaleString()}
                  </span>
                  <span className="admin-match-events">{match._count.events} events</span>
                </div>
                <div className="admin-match-actions">
                  <Link
                    href={`/admin/matches/${match.id}`}
                    className="admin-btn admin-btn-primary btn-sm"
                  >
                    Match Center
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}