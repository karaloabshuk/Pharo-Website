'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type GameweekMatch = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  status: string;
  homeScore: number;
  awayScore: number;
};

type PlayerPoint = {
  id: string;
  points: number;
  player: { name: string };
};

type ManagerPoint = {
  id: string;
  points: number;
  fantasyTeam: { user: { name: string } };
};

type Gameweek = {
  id: string;
  number: number;
  name: string;
  status: string;
  matches: GameweekMatch[];
  playerPoints: PlayerPoint[];
  managerPoints: ManagerPoint[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#7a6a9a',
  ACTIVE: '#00d4e8',
  COMPLETED: '#43a047',
};

export default function GameweeksClient({ gameweeks }: { gameweeks: Gameweek[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [error, setError] = useState('');

  async function handleAddGameweek(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/gameweeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: Number(newNumber) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create gameweek');
        return;
      }

      setShowAdd(false);
      setNewNumber('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setError('');
    try {
      const res = await fetch('/api/admin/gameweeks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update gameweek');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to update gameweek');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gameweeks</h1>
          <p className="admin-page-subtitle">Manage gameweeks and matchday status</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          + Add Gameweek
        </button>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAddGameweek} className="admin-card admin-inline-form">
          <div className="admin-form-group">
            <label>Gameweek Number</label>
            <input
              type="number"
              min="1"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="e.g. 9"
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Create</button>
        </form>
      )}

      {gameweeks.length === 0 ? (
        <div className="admin-card">
          <p className="admin-empty">No gameweeks yet.</p>
        </div>
      ) : (
        gameweeks.map((gw) => {
          const totalPlayerPoints = gw.playerPoints.reduce((s, p) => s + p.points, 0);
          return (
            <div key={gw.id} className="admin-card admin-gw-card">
              <div className="admin-gw-header">
                <div className="admin-gw-title">
                  <span className="admin-gw-number">GW{gw.number}</span>
                  <span className="admin-gw-name">{gw.name}</span>
                </div>
                <div className="admin-gw-status">
                  <span
                    className="admin-status-dot"
                    style={{ background: STATUS_COLORS[gw.status] || '#7a6a9a' }}
                  />
                  {['PENDING', 'ACTIVE', 'COMPLETED'].map((s) => (
                    <button
                      key={s}
                      className={`admin-gw-status-btn ${gw.status === s ? 'active' : ''}`}
                      onClick={() => handleStatusChange(gw.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-gw-stats">
                <div className="admin-gw-stat">
                  <span className="admin-gw-stat-value">{gw.matches.length}</span>
                  <span className="admin-gw-stat-label">Matches</span>
                </div>
                <div className="admin-gw-stat">
                  <span className="admin-gw-stat-value">{gw.playerPoints.length}</span>
                  <span className="admin-gw-stat-label">Players Scored</span>
                </div>
                <div className="admin-gw-stat">
                  <span className="admin-gw-stat-value">{totalPlayerPoints}</span>
                  <span className="admin-gw-stat-label">Total Player Points</span>
                </div>
                <div className="admin-gw-stat">
                  <span className="admin-gw-stat-value">{gw.managerPoints.length}</span>
                  <span className="admin-gw-stat-label">Managers Scored</span>
                </div>
              </div>

              {gw.matches.length > 0 && (
                <div className="admin-gw-matches">
                  {gw.matches.map((m) => (
                    <div key={m.id} className="admin-gw-match">
                      <span>{m.homeTeam.name}</span>
                      <span className="admin-gw-score">
                        {m.homeScore} - {m.awayScore}
                      </span>
                      <span>{m.awayTeam.name}</span>
                      <span className={`admin-status-badge status-${m.status.toLowerCase()}`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {gw.managerPoints.length > 0 && (
                <div className="admin-gw-managers">
                  <h4 className="admin-section-label">Top Managers</h4>
                  <div className="admin-gw-manager-list">
                    {gw.managerPoints
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 5)
                      .map((mp, i) => (
                        <div key={mp.id} className="admin-gw-manager">
                          <span>#{i + 1}</span>
                          <span>{mp.fantasyTeam.user.name}</span>
                          <span className={`admin-points ${mp.points >= 0 ? 'pos' : 'neg'}`}>
                            {mp.points >= 0 ? `+${mp.points}` : mp.points}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}