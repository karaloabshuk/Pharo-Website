'use client';

import { useState } from 'react';
import type { EventType, Position } from '@/config/scoring';

type PlayerGW = {
  id: string;
  name: string;
  position: Position;
  team: string;
  gameweekPoints: { gameweek: number; points: number }[];
  totalPoints: number;
};

type LeaderboardEntry = {
  teamId: string;
  name: string;
  total: number;
  gameweeks: { gameweek: number; points: number }[];
};

export default function PointsClient({
  players,
  leaderboard,
  scoringRules,
  eventTypeLabels,
  positionLabels,
}: {
  players: PlayerGW[];
  leaderboard: LeaderboardEntry[];
  scoringRules: Record<string, Record<Position, number>>;
  eventTypeLabels: Record<EventType, string>;
  positionLabels: Record<Position, string>;
}) {
  const [tab, setTab] = useState<'player' | 'manager' | 'rules'>('player');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');

  const filteredPlayers = players
    .filter((p) => {
      if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const maxGW = Math.max(0, ...players.flatMap((p) => p.gameweekPoints.map((gp) => gp.gameweek)));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Points</h1>
          <p className="admin-page-subtitle">All fantasy points across gameweeks</p>
        </div>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'player' ? 'active' : ''}`}
            onClick={() => setTab('player')}
          >
            Players
          </button>
          <button
            className={`admin-tab ${tab === 'manager' ? 'active' : ''}`}
            onClick={() => setTab('manager')}
          >
            Managers
          </button>
          <button
            className={`admin-tab ${tab === 'rules' ? 'active' : ''}`}
            onClick={() => setTab('rules')}
          >
            Scoring Rules
          </button>
        </div>
      </div>

      {tab === 'player' && (
        <div className="admin-card">
          <div className="admin-table-toolbar">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-filter-btns">
              {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map((f) => (
                <button
                  key={f}
                  className={`admin-filter-btn ${positionFilter === f ? 'active' : ''}`}
                  onClick={() => setPositionFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Team</th>
                  {Array.from({ length: Math.min(8, maxGW) }, (_, i) => i + 1).map((gw) => (
                    <th key={gw}>GW{gw}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="admin-table-player">{player.name}</td>
                    <td>
                      <span className="admin-pos-badge">{player.position}</span>
                    </td>
                    <td>{player.team}</td>
                    {Array.from({ length: Math.min(8, maxGW) }, (_, i) => i + 1).map((gw) => {
                      const gp = player.gameweekPoints.find((x) => x.gameweek === gw);
                      const points = gp?.points ?? 0;
                      return (
                        <td key={gw}>
                          <span className={`admin-points ${points > 0 ? 'pos' : points < 0 ? 'neg' : 'zero'}`}>
                            {points > 0 ? `+${points}` : points}
                          </span>
                        </td>
                      );
                    })}
                    <td className={`admin-points ${player.totalPoints >= 0 ? 'pos' : 'neg'}`}>
                      {player.totalPoints >= 0 ? `+${player.totalPoints}` : player.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'manager' && (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Manager</th>
                  {Array.from({ length: Math.min(8, maxGW) }, (_, i) => i + 1).map((gw) => (
                    <th key={gw}>GW{gw}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr key={entry.teamId}>
                    <td className="admin-rank">#{i + 1}</td>
                    <td className="admin-table-player">{entry.name}</td>
                    {Array.from({ length: Math.min(8, maxGW) }, (_, j) => j + 1).map((gw) => {
                      const points = entry.gameweeks.find((g) => g.gameweek === gw)?.points ?? 0;
                      return (
                        <td key={gw}>
                          <span className={`admin-points ${points > 0 ? 'pos' : points < 0 ? 'neg' : 'zero'}`}>
                            {points > 0 ? `+${points}` : points}
                          </span>
                        </td>
                      );
                    })}
                    <td className={`admin-points ${entry.total >= 0 ? 'pos' : 'neg'}`}>
                      {entry.total >= 0 ? `+${entry.total}` : entry.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="admin-card">
          <h3 className="admin-section-label">Current Scoring Rules</h3>
          <p className="admin-page-subtitle">
            These are centralized in <code>src/config/scoring.ts</code>. To change them, edit that
            file — the entire system updates automatically.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>GK</th>
                  <th>DEF</th>
                  <th>MID</th>
                  <th>FWD</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(scoringRules).map(([eventType, rules]) => (
                  <tr key={eventType}>
                    <td className="admin-rules-event">
                      {eventTypeLabels[eventType as EventType]}
                    </td>
                    {(Object.keys(rules) as Position[]).map((pos) => (
                      <td key={pos}>
                        <span className={`admin-points ${rules[pos] >= 0 ? 'pos' : 'neg'}`}>
                          {rules[pos] >= 0 ? `+${rules[pos]}` : rules[pos]}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}