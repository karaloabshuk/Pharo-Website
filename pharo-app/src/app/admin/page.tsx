import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EVENT_TYPE_LABELS, POSITION_LABELS, type EventType } from '@/config/scoring';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login');
  }

  const [gameweeks, players, users, matches, recentEvents] = await Promise.all([
    prisma.gameweek.findMany({ orderBy: { number: 'desc' } }),
    prisma.player.count(),
    prisma.user.count(),
    prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        gameweek: true,
      },
      orderBy: { date: 'desc' },
    }),
    prisma.matchEvent.findMany({
      include: {
        player: { include: { team: true } },
        match: { include: { homeTeam: true, awayTeam: true, gameweek: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const currentGameweek = gameweeks.find((gw) => gw.status === 'ACTIVE') || gameweeks[0];

  // Leaderboard data
  const fantasyTeams = await prisma.fantasyTeam.findMany({
    include: {
      user: true,
      gameweekPoints: true,
    },
  });

  const leaderboard = fantasyTeams
    .map((team) => {
      const gwPoints = currentGameweek
        ? team.gameweekPoints.find((p) => p.gameweekId === currentGameweek.id)?.points ?? 0
        : 0;
      const total = team.gameweekPoints.reduce((sum, p) => sum + p.points, 0);
      return {
        name: team.user.name,
        gw: gwPoints,
        total,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const eventCounts = matches.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-subtitle">Welcome back, {session.name}</p>

      <div className="admin-dash-grid">
        <div className="admin-stat-card admin-stat-primary">
          <div className="admin-stat-label">Current Gameweek</div>
          <div className="admin-stat-value">
            {currentGameweek ? `GW${currentGameweek.number}` : '—'}
          </div>
          <div className="admin-stat-sub">{currentGameweek?.name}</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Players</div>
          <div className="admin-stat-value">{players}</div>
          <div className="admin-stat-sub">in system</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Fantasy Managers</div>
          <div className="admin-stat-value">{users}</div>
          <div className="admin-stat-sub">registered users</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Matches</div>
          <div className="admin-stat-value">{matches.length}</div>
          <div className="admin-stat-sub">
            {eventCounts.FINISHED || 0} finished · {eventCounts.LIVE || 0} live · {eventCounts.UPCOMING || 0} upcoming
          </div>
        </div>
      </div>

      <div className="admin-dash-two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Recent Match Events</h2>
            <Link href="/admin/matches" className="admin-text-link">View Matches</Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="admin-empty">No events recorded yet. Add events from a match center.</p>
          ) : (
            <div className="admin-event-list">
              {recentEvents.map((event) => (
                <div key={event.id} className="admin-event-row">
                  <span className={`admin-event-pos pos-${event.player.position.toLowerCase()}`}>
                    {event.player.position}
                  </span>
                  <span className="admin-event-name">{event.player.name}</span>
                  <span className="admin-event-meta">
                    {event.match.homeTeam.name} vs {event.match.awayTeam.name}
                  </span>
                  <span className={`admin-event-type ${event.points >= 0 ? 'pos' : 'neg'}`}>
                    {EVENT_TYPE_LABELS[event.eventType as EventType]}
                  </span>
                  <span className={`admin-event-points ${event.points >= 0 ? 'pos' : 'neg'}`}>
                    {event.points >= 0 ? `+${event.points}` : event.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Leaderboard</h2>
            <Link href="/admin/points" className="admin-text-link">View Points</Link>
          </div>
          {leaderboard.length === 0 ? (
            <p className="admin-empty">No fantasy managers yet.</p>
          ) : (
            <div className="admin-leaderboard">
              {leaderboard.map((entry, i) => (
                <div key={i} className="admin-lb-row">
                  <span className="admin-lb-rank">#{i + 1}</span>
                  <span className="admin-lb-name">{entry.name}</span>
                  <span className="admin-lb-gw">GW: {entry.gw}</span>
                  <span className="admin-lb-total">{entry.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-dash-actions">
        <Link href="/admin/matches?new=1" className="admin-btn admin-btn-primary">
          + Create Match
        </Link>
        <Link href="/admin/matches" className="admin-btn admin-btn-secondary">
          + Add Match Event
        </Link>
      </div>
    </div>
  );
}