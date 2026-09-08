'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  SCORING_RULES,
  type EventType,
  type Position,
} from '@/config/scoring';

type Player = {
  id: string;
  name: string;
  position: Position;
  price: number;
  teamId: string;
};

type Team = { id: string; name: string };

type Gameweek = { id: string; number: number; name: string };

type MatchEvent = {
  id: string;
  playerId: string;
  eventType: EventType;
  points: number;
  bonusValue: number | null;
  player: Player;
  createdAt: string | Date;
};

type Match = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team & { players: Player[] };
  awayTeam: Team & { players: Player[] };
  gameweek: Gameweek;
  status: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  date?: string | Date;
};

const EVENT_COLORS: Record<EventType, { bg: string; text: string }> = {
  GOAL: { bg: '#00d4e8', text: '#0d001a' },
  ASSIST: { bg: '#52b788', text: '#0d001a' },
  CLEAN_SHEET: { bg: '#2e7d32', text: '#fff' },
  SAVE: { bg: '#f9a825', text: '#0d001a' },
  PENALTY_SAVE: { bg: '#f57f17', text: '#0d001a' },
  YELLOW_CARD: { bg: '#fbc02d', text: '#0d001a' },
  RED_CARD: { bg: '#e8443a', text: '#fff' },
  OWN_GOAL: { bg: '#b71c1c', text: '#fff' },
  PENALTY_MISS: { bg: '#8d6e63', text: '#fff' },
  DEFENSIVE_CONTRIBUTION: { bg: '#1565c0', text: '#fff' },
  BONUS: { bg: '#a855f7', text: '#fff' },
};

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  FINISHED: 'Finished',
};

export default function MatchCenter({ match }: { match: Match }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [eventType, setEventType] = useState<EventType>('GOAL');
  const [bonusValue, setBonusValue] = useState(1);
  const [editEvent, setEditEvent] = useState<MatchEvent | null>(null);

  const allPlayers = [...match.homeTeam.players, ...match.awayTeam.players];
  const teamLookup: Record<string, string> = {
    [match.homeTeamId]: match.homeTeam.name,
    [match.awayTeamId]: match.awayTeam.name,
  };

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          eventType,
          bonusValue: eventType === 'BONUS' ? bonusValue : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add event');
        setLoading(false);
        return;
      }

      setPlayerId('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Delete this event? Points will be recalculated.')) return;
    setError('');

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete event');
        return;
      }
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    }
  }

  async function handleStatusChange(status: string) {
    setError('');
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to update match status');
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editEvent) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/events/${editEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          eventType,
          bonusValue: eventType === 'BONUS' ? bonusValue : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update event');
        setLoading(false);
        return;
      }

      setEditEvent(null);
      setPlayerId('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  function openEdit(event: MatchEvent) {
    setEditEvent(event);
    setPlayerId(event.playerId);
    setEventType(event.eventType);
    setBonusValue(event.bonusValue ?? 1);
  }

  return (
    <div className="admin-card">
      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-match-toolbar">
        <div className="admin-status-buttons">
          {['UPCOMING', 'LIVE', 'FINISHED'].map((s) => (
            <button
              key={s}
              className={`admin-status-btn ${match.status === s ? 'active' : ''}`}
              onClick={() => handleStatusChange(s)}
              disabled={match.status === s}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-match-center-grid">
        {/* Left: Add event */}
        <div className="admin-match-add-event">
          <h3 className="admin-section-label">{editEvent ? 'Edit Event' : 'Add Event'}</h3>
          <form onSubmit={editEvent ? handleSaveEdit : handleAddEvent} className="admin-form">
            <div className="admin-form-group">
              <label>Player</label>
              <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} required>
                <option value="">Select player</option>
                <optgroup label={match.homeTeam.name}>
                  {match.homeTeam.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={match.awayTeam.name}>
                  {match.awayTeam.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="admin-form-group">
              <label>Event</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                {EVENT_TYPES.map((et) => (
                  <option key={et} value={et}>
                    {EVENT_TYPE_LABELS[et]}
                  </option>
                ))}
              </select>
            </div>

            {eventType === 'BONUS' && (
              <div className="admin-form-group">
                <label>Bonus Points</label>
                <div className="admin-bonus-options">
                  {[1, 2, 3].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`admin-bonus-btn ${bonusValue === v ? 'active' : ''}`}
                      onClick={() => setBonusValue(v)}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-form-footer">
              {editEvent && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => { setEditEvent(null); setPlayerId(''); }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editEvent ? 'Save Event' : 'Add Event'}
              </button>
            </div>
          </form>

          {/* Points legend */}
          <div className="admin-points-preview">
            <h3 className="admin-section-label">Event Preview</h3>
            {playerId && (
              <div className="admin-preview-row">
                <span>
                  {allPlayers.find((p) => p.id === playerId)?.name} ·{' '}
                  {allPlayers.find((p) => p.id === playerId)?.position}
                </span>
                <span className="admin-preview-points">
                  {(() => {
                    const p = allPlayers.find((pl) => pl.id === playerId);
                    if (!p) return '—';
                    const position = p.position;
                    let base: number;
                    if (eventType === 'BONUS') {
                      base = bonusValue;
                    } else if (eventType === 'SAVE') {
                      base = SCORING_RULES.SAVE[position];
                    } else {
                      base = SCORING_RULES[eventType][position];
                    }
                    return Number(base) >= 0 ? `+${base}` : String(base);
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Match events list */}
        <div className="admin-match-events">
          <h3 className="admin-section-label">Match Events</h3>
          {match.events.length === 0 ? (
            <p className="admin-empty">No events yet. Add the first one.</p>
          ) : (
            <div className="admin-event-list">
              {match.events.map((event, idx) => {
                const color = EVENT_COLORS[event.eventType];
                return (
                  <div key={event.id} className="admin-event-item">
                    <span className="admin-event-index">#{idx + 1}</span>
                    <div className="admin-event-info">
                      <span className="admin-event-player">
                        {event.player.name}
                        <span className="admin-event-team">
                          {teamLookup[event.player.teamId]}
                        </span>
                      </span>
                      <span
                        className="admin-event-badge"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {EVENT_TYPE_LABELS[event.eventType]}
                        {event.bonusValue ? ` +${event.bonusValue}` : ''}
                      </span>
                    </div>
                    <span className={`admin-event-points ${event.points >= 0 ? 'pos' : 'neg'}`}>
                      {event.points >= 0 ? `+${event.points}` : event.points}
                    </span>
                    <div className="admin-event-actions">
                      <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(event)}>
                        ✎
                      </button>
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}