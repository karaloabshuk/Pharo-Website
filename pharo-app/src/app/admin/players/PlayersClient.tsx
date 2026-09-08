'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Team = { id: string; name: string };

type PlayerData = {
  id: string;
  name: string;
  position: string;
  price: number;
  team: string;
  teamId: string;
  events: number;
  totalPoints: number;
};

const POSITION_ORDER: Record<string, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  FWD: 3,
};

const POSITION_COLOR: Record<string, string> = {
  GK: '#f9a825',
  DEF: '#43a047',
  MID: '#1e88e5',
  FWD: '#e8443a',
};

export default function PlayersClient({
  players,
  teams,
}: {
  players: PlayerData[];
  teams: Team[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', position: 'MID', price: '3.0', teamId: '' });
  const [error, setError] = useState('');

  const filtered = players
    .filter((p) => {
      if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position]);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          position: form.position,
          price: Number(form.price),
          teamId: form.teamId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add player');
        return;
      }

      setShowAdd(false);
      setForm({ name: '', position: 'MID', price: '3.0', teamId: '' });
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    }
  }

  return (
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
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          + Add Player
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddPlayer} className="admin-form admin-add-player-form">
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Player Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Player name"
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              >
                <option value="GK">GK</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Price ($M)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Team</label>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                required
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-form-footer">
            <button type="submit" className="admin-btn admin-btn-primary">Add Player</button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Position</th>
              <th>Team</th>
              <th>Price</th>
              <th>Events</th>
              <th>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => (
              <tr key={player.id}>
                <td className="admin-table-player">
                  <span
                    className="admin-avatar"
                    style={{ background: POSITION_COLOR[player.position] }}
                  >
                    {player.position}
                  </span>
                  {player.name}
                </td>
                <td>
                  <span
                    className="admin-pos-badge"
                    style={{ background: POSITION_COLOR[player.position] }}
                  >
                    {player.position}
                  </span>
                </td>
                <td>{player.team}</td>
                <td>${player.price}M</td>
                <td>{player.events}</td>
                <td className={`admin-points ${player.totalPoints >= 0 ? 'pos' : 'neg'}`}>
                  {player.totalPoints >= 0 ? `+${player.totalPoints}` : player.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}