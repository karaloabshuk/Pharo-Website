'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Team = { id: string; name: string };
type Gameweek = { id: string; number: number; name: string };

export default function MatchActions({
  teams,
  gameweeks,
}: {
  teams: Team[];
  gameweeks: Gameweek[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    gameweekId: '',
    status: 'UPCOMING',
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create match');
        setLoading(false);
        return;
      }

      setShowForm(false);
      setForm({ homeTeamId: '', awayTeamId: '', date: '', gameweekId: '', status: 'UPCOMING' });
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="admin-page-actions">
      <button
        className={`admin-btn ${showForm ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel' : '+ Create Match'}
      </button>

      {showForm && (
        <div className="admin-form-overlay">
          <div className="admin-form-card">
            <h3>Create Match</h3>
            {error && <div className="admin-form-error">{error}</div>}
            <form onSubmit={handleCreate} className="admin-form">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Home Team</label>
                  <select
                    value={form.homeTeamId}
                    onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })}
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Away Team</label>
                  <select
                    value={form.awayTeamId}
                    onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })}
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Gameweek</label>
                  <select
                    value={form.gameweekId}
                    onChange={(e) => setForm({ ...form, gameweekId: e.target.value })}
                    required
                  >
                    <option value="">Select gameweek</option>
                    {gameweeks.map((gw) => (
                      <option key={gw.id} value={gw.id}>{gw.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="LIVE">Live</option>
                    <option value="FINISHED">Finished</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-footer">
                <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}